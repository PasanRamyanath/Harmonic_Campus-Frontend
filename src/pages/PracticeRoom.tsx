import { useEffect, useRef, useState, useCallback } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function freqToNote(freq: number): { note: string; octave: number; cents: number } | null {
  if (freq <= 0) return null;
  const semitones = 12 * Math.log2(freq / 440);
  const rounded = Math.round(semitones);
  const cents = Math.round((semitones - rounded) * 100);
  const noteIndex = ((rounded % 12) + 12 + 9) % 12;
  const octave = Math.floor((rounded + 69) / 12) - 1;
  return { note: NOTE_NAMES[noteIndex], octave, cents };
}

function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let best_offset = -1;
  let best_correlation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let last_correlation = 1;
  let found = false;

  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) correlation += Math.abs(buffer[i] - buffer[i + offset]);
    correlation = 1 - correlation / MAX_SAMPLES;
    if (correlation > 0.9 && correlation > last_correlation) {
      found = true;
      if (correlation > best_correlation) { best_correlation = correlation; best_offset = offset; }
    } else if (found) break;
    last_correlation = correlation;
  }

  if (best_correlation > 0.01 && best_offset > 0) return sampleRate / best_offset;
  return -1;
}

const SCALES = [
  { name: 'C Major', notes: ['C4','D4','E4','F4','G4','A4','B4','C5'], description: 'Play C D E F G A B C' },
  { name: 'A Minor', notes: ['A3','B3','C4','D4','E4','F4','G4','A4'], description: 'Play A B C D E F G A' },
  { name: 'G Major', notes: ['G3','A3','B3','C4','D4','E4','F#4','G4'], description: 'Play G A B C D E F# G' },
];

const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33,
};

type SessionNote = { detected: string; target: string; correct: boolean; timestamp: number };

export default function PracticeRoom() {
  const { appUser } = useAuth();
  const [micGranted, setMicGranted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string>('—');
  const [detectedFreq, setDetectedFreq] = useState<number>(0);
  const [centsOff, setCentsOff] = useState<number>(0);
  const [selectedScale, setSelectedScale] = useState(0);
  const [targetNoteIdx, setTargetNoteIdx] = useState(0);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastNoteTimeRef = useRef<number>(0);

  const requestMic = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicGranted(true);
    } catch (err: any) {
      setMicError(err.message || 'Could not access microphone');
    }
  };

  const analyse = useCallback(() => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const freq = detectPitch(buffer, audioCtxRef.current.sampleRate);

    if (freq > 50 && freq < 2000) {
      const noteInfo = freqToNote(freq);
      if (noteInfo) {
        const label = `${noteInfo.note}${noteInfo.octave}`;
        setDetectedNote(label);
        setDetectedFreq(Math.round(freq * 10) / 10);
        setCentsOff(noteInfo.cents);

        if (sessionActive) {
          const scale = SCALES[selectedScale];
          const target = scale.notes[targetNoteIdx];
          const targetNote = target.replace(/\d/, '');
          const now = Date.now();
          if (now - lastNoteTimeRef.current > 600) {
            const correct = noteInfo.note === targetNote;
            const entry: SessionNote = { detected: label, target, correct, timestamp: now };
            setSessionNotes(prev => {
              const updated = [...prev, entry];
              if (correct) {
                setTargetNoteIdx(idx => {
                  const next = idx + 1;
                  if (next >= scale.notes.length) {
                    setSessionActive(false);
                    const total = updated.length;
                    const correctCount = updated.filter(n => n.correct).length;
                    setScore({ correct: correctCount, total });
                  }
                  return next < scale.notes.length ? next : idx;
                });
              }
              return updated;
            });
            lastNoteTimeRef.current = now;
          }
        }
      }
    } else {
      setDetectedNote('—');
      setDetectedFreq(0);
      setCentsOff(0);
    }

    rafRef.current = requestAnimationFrame(analyse);
  }, [sessionActive, selectedScale, targetNoteIdx]);

  useEffect(() => {
    if (isListening) { rafRef.current = requestAnimationFrame(analyse); }
    else { cancelAnimationFrame(rafRef.current); }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, analyse]);

  const startListening = () => { if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume(); setIsListening(true); };
  const stopListening = () => { setIsListening(false); setDetectedNote('—'); setDetectedFreq(0); };

  const startSession = () => {
    setTargetNoteIdx(0); setSessionNotes([]); setScore(null); setSessionActive(true);
    if (!isListening) startListening();
  };

  const stopSession = () => {
    setSessionActive(false);
    const total = sessionNotes.length;
    const correct = sessionNotes.filter(n => n.correct).length;
    if (total > 0) setScore({ correct, total });
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const scale = SCALES[selectedScale];
  const targetNote = sessionActive ? scale.notes[targetNoteIdx] : null;
  const targetNoteLabel = targetNote ? targetNote.replace(/(\d)/, '$1') : null;
  const targetFreq = targetNote ? NOTE_FREQUENCIES[targetNote] : null;
  const accuracy = score ? Math.round((score.correct / Math.max(score.total, 1)) * 100) : null;
  const pitchAccuracyPct = Math.max(0, 100 - Math.abs(centsOff) * 2);
  const centColor = Math.abs(centsOff) < 10 ? 'text-emerald-400' : Math.abs(centsOff) < 25 ? 'text-yellow-400' : 'text-red-400';

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Practice Room' }]} />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Practice Room</h1>
            <p className="text-slate-500 text-sm">Real-time pitch detection via Web Audio API — practice scales with instant feedback</p>
          </div>
        </div>

        {/* Mic gate */}
        {!micGranted && (
          <div className="glass-card p-10 text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Microphone Access Required</h2>
            <p className="text-slate-400 text-sm mb-2 max-w-sm mx-auto">The Practice Room analyses your playing in real-time using your microphone.</p>
            <p className="text-slate-600 text-xs mb-6">No audio is recorded or uploaded — all processing happens locally in your browser.</p>
            {micError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm inline-block">
                {micError}
              </div>
            )}
            <button onClick={requestMic} className="btn-primary !px-8 !py-3">
              Grant Microphone Access
            </button>
          </div>
        )}

        {micGranted && (
          <div className="space-y-5">
            {/* Live pitch display */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  Live Pitch Detection
                  {isListening && (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-normal">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Listening
                    </span>
                  )}
                </h2>
                {!isListening ? (
                  <button onClick={startListening} className="btn-primary text-sm !py-2 !px-4">
                    <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Listening
                  </button>
                ) : (
                  <button onClick={stopListening} className="btn-ghost text-sm !py-2 !px-4">
                    <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z" />
                    </svg>
                    Stop
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="rounded-2xl bg-purple-600/10 border border-purple-500/20 p-4 text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-1">{detectedNote}</div>
                  <div className="text-slate-500 text-xs">Detected Note</div>
                </div>
                <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">{detectedFreq > 0 ? detectedFreq : '—'}</div>
                  <div className="text-slate-500 text-xs">Frequency (Hz)</div>
                </div>
                <div className={`rounded-2xl p-4 text-center border ${Math.abs(centsOff) < 10 ? 'bg-emerald-500/10 border-emerald-500/20' : Math.abs(centsOff) < 25 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className={`text-3xl font-bold mb-1 ${centColor}`}>
                    {detectedFreq > 0 ? `${centsOff > 0 ? '+' : ''}${centsOff}¢` : '—'}
                  </div>
                  <div className="text-slate-500 text-xs">Cents off pitch</div>
                </div>
              </div>

              {detectedFreq > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Pitch Accuracy</span>
                    <span className={centColor}>{pitchAccuracyPct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${pitchAccuracyPct > 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : pitchAccuracyPct > 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                      style={{ width: `${pitchAccuracyPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scale exercise */}
            <div className="glass-card p-6">
              <h2 className="text-white font-semibold mb-5">Scale Exercise</h2>

              {/* Scale selector */}
              <div className="mb-5">
                <label className="block text-slate-500 text-xs font-medium mb-3">Choose a Scale</label>
                <div className="flex flex-wrap gap-2">
                  {SCALES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedScale(i); setTargetNoteIdx(0); setSessionNotes([]); setScore(null); setSessionActive(false); }}
                      className={`px-4 py-2 rounded-xl text-sm transition-all border ${selectedScale === i ? 'bg-gradient-to-r from-purple-600 to-cyan-500 border-transparent text-white font-medium shadow-lg shadow-purple-500/20' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-slate-500 text-xs">{scale.description}</p>
              </div>

              {/* Note sequence */}
              <div className="flex flex-wrap gap-2 mb-5">
                {scale.notes.map((n, i) => {
                  const isTarget = sessionActive && i === targetNoteIdx;
                  const isDone = sessionActive && i < targetNoteIdx;
                  const wasCorrect = sessionNotes.filter(sn => sn.target === n && sn.correct).length > 0;
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all ${
                        isTarget ? 'border-purple-500 bg-purple-600/20 text-purple-300 scale-110 shadow-lg shadow-purple-500/30' :
                        isDone && wasCorrect ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
                        isDone ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                        'border-white/10 bg-white/3 text-slate-500'
                      }`}
                    >
                      {n.replace(/\d/, '')}
                    </div>
                  );
                })}
              </div>

              {/* Target display */}
              {sessionActive && targetNoteLabel && (
                <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-5 mb-5 text-center">
                  <div className="text-sm text-purple-400 mb-1">Play this note:</div>
                  <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{targetNoteLabel}</div>
                  {targetFreq && <div className="text-xs text-purple-500 mt-1">Target: {targetFreq} Hz</div>}
                  <div className="text-xs text-slate-600 mt-1">Note {targetNoteIdx + 1} of {scale.notes.length}</div>
                </div>
              )}

              {/* Session controls */}
              <div className="flex gap-3">
                {!sessionActive ? (
                  <button onClick={startSession} className="btn-primary !py-2.5 !px-6">
                    <svg className="inline-block w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Scale Exercise
                  </button>
                ) : (
                  <button onClick={stopSession} className="px-6 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/25 transition-colors">
                    End Session
                  </button>
                )}
              </div>

              {/* Score */}
              {score && (
                <div className={`mt-5 p-6 rounded-2xl border-2 text-center ${accuracy! >= 80 ? 'border-emerald-500/40 bg-emerald-500/10' : accuracy! >= 50 ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                  <div className={`text-6xl font-bold mb-2 ${accuracy! >= 80 ? 'text-emerald-400' : accuracy! >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {accuracy}%
                  </div>
                  <div className="font-semibold text-white mb-1">
                    {accuracy! >= 80 ? 'Excellent work!' : accuracy! >= 50 ? 'Good effort!' : 'Keep practicing!'}
                  </div>
                  <div className="text-sm text-slate-400 mb-4">
                    {score.correct} correct notes out of {score.total} attempts
                  </div>
                  <button onClick={startSession} className="btn-primary text-sm !py-2 !px-5">Try Again</button>
                </div>
              )}

              {/* Session log */}
              {sessionNotes.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider">Session Log</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {[...sessionNotes].reverse().map((sn, i) => (
                      <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${sn.correct ? 'bg-emerald-500/10 border border-emerald-500/15' : 'bg-red-500/10 border border-red-500/15'}`}>
                        <span className="text-slate-400">Played: <strong className="text-white">{sn.detected}</strong></span>
                        <span className="text-slate-400">Target: <strong className="text-white">{sn.target.replace(/(\d)/, '$1')}</strong></span>
                        <span className={sn.correct ? 'text-emerald-400' : 'text-red-400'}>{sn.correct ? '✓ Correct' : '✗ Miss'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Practice tips */}
            <div className="glass-card p-6">
              <h2 className="text-white font-semibold mb-4">Practice Tips</h2>
              <ul className="space-y-3">
                {[
                  'Play each note clearly and hold it for at least half a second',
                  'The "Cents off pitch" indicator shows how flat (−) or sharp (+) you are',
                  'Green = within ±10 cents (excellent), Yellow = ±25 cents (good), Red = >25 cents (off)',
                  'Play in a quiet environment for best pitch detection accuracy',
                  'Your audio is processed locally in the browser — nothing is recorded or uploaded',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="w-5 h-5 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
