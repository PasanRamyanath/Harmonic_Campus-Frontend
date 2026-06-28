import { useState, useRef, useEffect } from 'react';
import { separateAudio, checkAudioHealth, cleanupJob } from '../api/audioApi';
import type { Engine, SeparationResult, ServiceHealth } from '../api/audioApi';
import Breadcrumbs from '../components/Breadcrumbs';

interface EngineOption { value: number; label: string; description: string; model: string }
interface EngineConfig { name: string; description: string; stems: EngineOption[] }

const ENGINES: Record<Engine, EngineConfig> = {
  demucs: {
    name: 'Demucs',
    description: 'Meta AI — State-of-the-art quality, slower processing',
    stems: [
      { value: 4, label: '4 Stems', description: 'Vocals + Drums + Bass + Other', model: 'htdemucs' },
      { value: 6, label: '6 Stems', description: 'Vocals + Drums + Bass + Guitar + Piano + Other', model: 'htdemucs_6s' },
    ],
  },
  spleeter: {
    name: 'Spleeter',
    description: 'Deezer — Faster processing, good quality',
    stems: [
      { value: 2, label: '2 Stems', description: 'Vocals + Accompaniment', model: 'spleeter:2stems' },
      { value: 4, label: '4 Stems', description: 'Vocals + Drums + Bass + Other', model: 'spleeter:4stems' },
      { value: 5, label: '5 Stems', description: 'Vocals + Drums + Bass + Piano + Other', model: 'spleeter:5stems' },
    ],
  },
};

const STEM_GRADIENTS: Record<string, string> = {
  vocals: 'from-red-500 to-rose-600',
  accompaniment: 'from-blue-500 to-indigo-600',
  no_vocals: 'from-blue-500 to-indigo-600',
  drums: 'from-yellow-500 to-orange-600',
  bass: 'from-purple-500 to-violet-600',
  piano: 'from-teal-500 to-cyan-600',
  guitar: 'from-orange-500 to-amber-600',
  other: 'from-slate-500 to-slate-600',
};

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function AudioTools() {
  const [file, setFile] = useState<File | null>(null);
  const [engine, setEngine] = useState<Engine>('demucs');
  const [stems, setStems] = useState(4);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<SeparationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAudioHealth()
      .then(setServiceHealth)
      .catch(() => setServiceHealth({ nodeBackend: 'error', demucs: { status: 'unknown' }, spleeter: { status: 'unknown' } }));
  }, []);

  useEffect(() => { setStems(ENGINES[engine].stems[0].value); }, [engine]);

  const isAvailable = (eng: Engine) => !serviceHealth || serviceHealth[eng]?.status === 'ok';

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    setFile(f); setResult(null); setError(null); setStatus('idle');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('audio/')) handleFileChange(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus('uploading'); setProgress('Uploading file…'); setError(null); setResult(null);
    try {
      setStatus('processing');
      setProgress(`Processing with ${ENGINES[engine].name}… This may take several minutes.`);
      const data = await separateAudio(file, engine, stems);
      setResult(data); setStatus('done'); setProgress('');
    } catch (err: any) { setError(err.message || 'Unknown error'); setStatus('error'); setProgress(''); }
  };

  const handleReset = async () => {
    if (result?.job_id) await cleanupJob(engine, result.job_id).catch(() => {});
    setFile(null); setResult(null); setError(null); setStatus('idle'); setProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const isProcessing = status === 'uploading' || status === 'processing';
  const currentConfig = ENGINES[engine];

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Audio Tools' }]} />

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-600/15 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-5">
            AI-Powered
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Audio Stem Separator</h1>
          <p className="text-slate-400 text-lg">
            Split any song into separate vocal, instrumental, and instrument tracks using AI
          </p>
        </div>

        {/* Service health */}
        {serviceHealth && (
          <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="text-slate-500 font-medium">Services:</span>
            <span className={`flex items-center gap-1.5 font-medium ${isAvailable('demucs') ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isAvailable('demucs') ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Demucs {isAvailable('demucs') ? '(ready)' : '(offline)'}
            </span>
            <span className={`flex items-center gap-1.5 font-medium ${isAvailable('spleeter') ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isAvailable('spleeter') ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Spleeter {isAvailable('spleeter') ? '(ready)' : '(offline)'}
            </span>
            <button
              onClick={() => checkAudioHealth().then(setServiceHealth).catch(() => {})}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Engine selection */}
          <div className="glass-card p-5">
            <h2 className="text-white font-semibold mb-4">Select AI Engine</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(ENGINES) as [Engine, EngineConfig][]).map(([key, config]) => {
                const available = isAvailable(key);
                const active = engine === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!available}
                    onClick={() => available && setEngine(key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? 'border-purple-500 bg-purple-600/15 shadow-lg shadow-purple-500/10'
                        : 'border-white/10 bg-white/3 hover:border-purple-500/40'
                    } ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-white font-bold">{config.name}</div>
                    <div className="text-slate-400 text-xs mt-1">{config.description}</div>
                    <div className="text-slate-600 text-xs mt-2">Stems: {config.stems.map(s => s.value).join(', ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : dragOver
                  ? 'border-purple-500 bg-purple-600/10'
                  : 'border-white/10 bg-white/3 hover:border-purple-500/40 hover:bg-purple-600/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">{file.name}</div>
                  <div className="text-slate-500 text-sm">{formatSize(file.size)}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-white font-medium">Drop audio file here or click to browse</p>
                <p className="text-slate-500 text-sm">Supported: MP3, WAV, FLAC, OGG, M4A, AAC — max 50 MB</p>
              </div>
            )}
          </div>

          {/* Stem mode */}
          <div className="glass-card p-5">
            <h2 className="text-white font-semibold mb-4">Separation Mode ({currentConfig.name})</h2>
            <div className="flex flex-wrap gap-3">
              {currentConfig.stems.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStems(opt.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    stems === opt.value ? 'border-cyan-500 bg-cyan-600/15' : 'border-white/10 bg-white/3 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="text-white font-semibold text-sm">{opt.label}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{opt.description}</div>
                  <div className="text-slate-600 text-xs mt-1">Model: {opt.model}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || isProcessing}
              className="btn-primary flex-1 !py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing with {currentConfig.name}…
                </>
              ) : 'Separate Audio'}
            </button>
            {(file || result) && (
              <button type="button" onClick={handleReset} className="btn-ghost !py-3 !px-6">Reset</button>
            )}
          </div>
        </form>

        {/* Progress */}
        {progress && (
          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
            <svg className="animate-spin w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <div>
              <div className="text-yellow-300 font-medium text-sm">{progress}</div>
              <div className="text-yellow-400/60 text-xs mt-1">First run downloads AI models. Subsequent runs are faster.</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <span className="text-red-400 font-semibold">Error: </span>
            <span className="text-red-400/80 text-sm">{error}</span>
          </div>
        )}

        {/* Results */}
        {result && result.files && Object.keys(result.files).length > 0 && (
          <div className="mt-8 glass-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-white font-bold text-xl">Separation Complete!</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Job: <code className="text-slate-400">{result.job_id}</code> · Engine: <code className="text-slate-400">{result.engine}</code> · Model: <code className="text-slate-400">{result.model}</code> · {Object.keys(result.files).length} stems
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(result.files).map(([stemName, url]) => (
                <div key={stemName} className="rounded-xl overflow-hidden border border-white/10">
                  <div className={`px-4 py-3 bg-gradient-to-r ${STEM_GRADIENTS[stemName] || 'from-slate-500 to-slate-600'} text-white font-semibold text-sm`}>
                    {stemName.charAt(0).toUpperCase() + stemName.slice(1).replace('_', ' ')}
                  </div>
                  <div className="p-4 bg-white/3">
                    <audio controls className="w-full mb-3" src={url} />
                    <a href={url} download={`${stemName}.wav`} className="block text-center text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
                      ↓ Download WAV
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info panels */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Demucs (Meta AI)', points: ['Best quality separation', '4 stems: Vocals, Drums, Bass, Other', '6 stems: + Guitar & Piano', 'First run downloads ~1 GB model'] },
            { title: 'Spleeter (Deezer)', points: ['Faster processing', '2 stems: Vocals + Accompaniment', '4 stems: Vocals, Drums, Bass, Other', '5 stems: + Piano'] },
          ].map(info => (
            <div key={info.title} className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3">{info.title}</h3>
              <ul className="space-y-1.5">
                {info.points.map(p => (
                  <li key={p} className="flex items-center gap-2 text-slate-400 text-sm">
                    <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
