import { useEffect, useState } from 'react';
import * as courseApi from '../api/courseApi';
import { uploadVideoToYoutube } from '../api/youtubeApi';

type ContentItem = { type?: 'text' | 'video' | 'file'; text?: string; url?: string; filename?: string; mimeType?: string; size?: number };
type Lesson = { lessonId?: string; title: string; order?: number; contents?: ContentItem[] };
type Module = { moduleId?: string; title: string; order?: number; lessons: Lesson[] };
type Course = { _id?: string; title: string; description: string; accessTier: string; status: string; tags?: string[]; modules?: Module[] };

export default function CourseEditor({ course, onCancel, onSave, saving }: { course: Course; onCancel: () => void; onSave: (c: Course) => void; saving: boolean }) {
  const [local, setLocal] = useState<Course>({ ...course });
  const [tagInput, setTagInput] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [ytUploading, setYtUploading] = useState<Record<string, number | null>>({});
  const [ytError, setYtError] = useState<Record<string, string | null>>({});

  useEffect(() => { setLocal({ ...course }); }, [course]);

  const updateField = (k: keyof Course, v: any) => setLocal(prev => ({ ...prev, [k]: v }));

  const normalizeBeforeSave = (c: Course): Course => {
    const out: Course = { ...c };
    out.tags = (out.tags || []).map(t => String(t).trim()).filter(Boolean);
    out.modules = (out.modules || []).map((m, mi) => ({
      ...m, order: mi + 1,
      lessons: (m.lessons || []).map((l, li) => ({
        ...l, order: li + 1,
        contents: (l.contents || []).map(ct => ({ ...(ct || {}), type: (ct as any)?.type === 'pdf' ? 'file' : (ct as any)?.type }))
      }))
    }));
    return out;
  };

  const validate = (c: Course) => {
    const errors: string[] = [];
    if ((c.title || '').trim().length < 10) errors.push('Title must be at least 10 characters.');
    if ((c.description || '').trim().length < 50) errors.push('Description must be at least 50 characters.');
    (c.modules || []).forEach((m, mi) => {
      if (!m.title || String(m.title).trim().length < 3) errors.push(`Module ${mi + 1} title too short.`);
      (m.lessons || []).forEach((l, li) => {
        if (!l.title || String(l.title).trim().length < 3) errors.push(`Lesson ${mi + 1}.${li + 1} title too short.`);
      });
    });
    return errors;
  };

  const addModule = () => {
    const newIdx = (local.modules || []).length;
    const m: Module = { moduleId: crypto.randomUUID(), title: '', order: newIdx + 1, lessons: [] };
    updateField('modules', [...(local.modules || []), m]);
    setExpandedModules(prev => ({ ...prev, [newIdx]: true }));
  };

  const updateModule = (idx: number, patch: Partial<Module>) => {
    const modules = [...(local.modules || [])];
    modules[idx] = { ...modules[idx], ...patch };
    updateField('modules', modules);
  };

  const removeModule = (idx: number) => {
    const modules = [...(local.modules || [])];
    modules.splice(idx, 1);
    updateField('modules', modules);
  };

  const addLesson = (mIdx: number) => {
    const modules = [...(local.modules || [])];
    const lessons = [...(modules[mIdx].lessons || [])];
    lessons.push({ lessonId: crypto.randomUUID(), title: '', order: lessons.length + 1, contents: [] });
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
    setExpandedLessons(prev => ({ ...prev, [`${mIdx}-${lessons.length - 1}`]: true }));
  };

  const updateLesson = (mIdx: number, lIdx: number, patch: Partial<Lesson>) => {
    const modules = [...(local.modules || [])];
    const lessons = [...(modules[mIdx].lessons || [])];
    lessons[lIdx] = { ...lessons[lIdx], ...patch };
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
  };

  const removeLesson = (mIdx: number, lIdx: number) => {
    const modules = [...(local.modules || [])];
    const lessons = [...(modules[mIdx].lessons || [])];
    lessons.splice(lIdx, 1);
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
  };

  const addContentItem = (mIdx: number, lIdx: number, type: ContentItem['type']) => {
    const modules = [...(local.modules || [])];
    const lessons = [...(modules[mIdx].lessons || [])];
    const lesson = { ...(lessons[lIdx] || {} as any) } as any;
    lesson.contents = [...(lesson.contents || []), { type, text: '', url: '' }];
    lessons[lIdx] = lesson;
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
  };

  const updateContentItem = (mIdx: number, lIdx: number, cIdx: number, patch: Partial<ContentItem>) => {
    const modules = [...(local.modules || [])];
    const lessons = [...(modules[mIdx].lessons || [])];
    const contents = [...((lessons[lIdx].contents as any[]) || [])];
    contents[cIdx] = { ...contents[cIdx], ...patch };
    lessons[lIdx] = { ...lessons[lIdx], contents } as any;
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
  };

  const removeContentItem = (mIdx: number, lIdx: number, cIdx: number) => {
    const modules = [...(local.modules || [])];
    const lessons = [...(modules[mIdx].lessons || [])];
    const contents = [...((lessons[lIdx].contents as any[]) || [])];
    contents.splice(cIdx, 1);
    lessons[lIdx] = { ...lessons[lIdx], contents } as any;
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
  };

  const handleFileUpload = async (mIdx: number, lIdx: number, file: File) => {
    if (!file) return;
    try {
      const res = await courseApi.uploadFile(file);
      const modules = [...(local.modules || [])];
      const lessons = [...(modules[mIdx].lessons || [])];
      const lesson = { ...(lessons[lIdx] || {} as any) } as any;
      const contents = [...(lesson.contents || [])];
      const fileMeta = { type: 'file', url: res.url, filename: res.originalName || res.filename, mimeType: res.mimeType, size: res.size };
      const placeholderIdx = contents.findIndex((it: any) => it?.type === 'file' && !(it.url || it.filename));
      if (placeholderIdx >= 0) contents[placeholderIdx] = { ...contents[placeholderIdx], ...fileMeta };
      else contents.push(fileMeta);
      lesson.contents = contents;
      lessons[lIdx] = lesson;
      modules[mIdx].lessons = lessons;
      updateField('modules', modules);
    } catch { alert('File upload failed'); }
  };

  const handleYoutubeUpload = async (mIdx: number, lIdx: number, cIdx: number, file: File) => {
    const key = `${mIdx}-${lIdx}-${cIdx}`;
    setYtError(prev => ({ ...prev, [key]: null }));
    setYtUploading(prev => ({ ...prev, [key]: 0 }));
    try {
      const lesson = (local.modules || [])[mIdx]?.lessons?.[lIdx];
      const result = await uploadVideoToYoutube(file, { title: local.title, courseId: local._id || '', lessonTitle: lesson?.title || '' }, (pct) => setYtUploading(prev => ({ ...prev, [key]: pct })));
      const modules = [...(local.modules || [])];
      const lessons = [...(modules[mIdx].lessons || [])];
      const contents = [...((lessons[lIdx].contents as any[]) || [])];
      contents[cIdx] = { ...contents[cIdx], url: result.url };
      lessons[lIdx] = { ...lessons[lIdx], contents } as any;
      modules[mIdx].lessons = lessons;
      updateField('modules', modules);
    } catch (err: any) {
      setYtError(prev => ({ ...prev, [key]: err?.response?.data?.error || err?.message || 'Upload failed' }));
    } finally {
      setYtUploading(prev => ({ ...prev, [key]: null }));
    }
  };

  const commitTag = () => {
    const raw = tagInput.trim().replace(/,$/, '');
    if (!raw) return;
    updateField('tags', Array.from(new Set([...(local.tags || []), raw])));
    setTagInput('');
  };

  const allErrors = validate(local);
  const titleLen = (local.title || '').trim().length;
  const descLen = (local.description || '').trim().length;
  const step1Errors = allErrors.filter(e => e.includes('Title') || e.includes('Description'));
  const step2Errors = allErrors.filter(e => !e.includes('Title must') && !e.includes('Description'));

  const renderContentBlock = (ct: ContentItem, mi: number, li: number, ci: number) => {
    const ytKey = `${mi}-${li}-${ci}`;
    const uploading = ytUploading[ytKey];
    const ytErr = ytError[ytKey];

    const typeConfig = {
      text:  { label: 'Text Block',  activeCls: 'bg-blue-500/15 border-blue-500/30 text-blue-400' },
      video: { label: 'Video',       activeCls: 'bg-red-500/15 border-red-500/30 text-red-400' },
      file:  { label: 'Attachment',  activeCls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
    } as const;

    return (
      <div key={ci} className="rounded-2xl border border-white/8 bg-[#0a0a1a]/60 overflow-hidden">
        {/* Block header: type selector + delete */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex gap-1.5 flex-1">
            {(['text', 'video', 'file'] as const).map(t => (
              <button
                key={t}
                onClick={() => updateContentItem(mi, li, ci, { type: t })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  ct.type === t ? typeConfig[t].activeCls : 'bg-white/4 border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
                }`}
              >
                {t === 'text' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                  </svg>
                )}
                {t === 'video' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
                {t === 'file' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                )}
                {typeConfig[t].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => removeContentItem(mi, li, ci)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            aria-label="Remove block"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>

        {/* Block body */}
        <div className="p-4">
          {ct.type === 'text' && (
            <textarea
              className="input-dark resize-none text-sm w-full"
              rows={4}
              value={ct.text || ''}
              onChange={e => updateContentItem(mi, li, ci, { text: e.target.value })}
              placeholder="Write your lesson content here — notes, instructions, theory explanations…"
            />
          )}

          {ct.type === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Paste an existing YouTube URL</label>
                <input
                  className="input-dark text-sm"
                  placeholder="https://youtube.com/watch?v=..."
                  value={ct.url || ''}
                  onChange={e => updateContentItem(mi, li, ci, { url: e.target.value })}
                />
                {ct.url && (
                  <a href={ct.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Preview on YouTube ↗
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs text-slate-600 font-medium">or upload a new video</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <div className="rounded-xl border border-dashed border-white/12 p-4 bg-white/[0.015]">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-red-400/60 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Upload to YouTube (auto-unlisted)</p>
                    <p className="text-xs text-slate-600 mt-0.5">mp4, webm, mov · up to 500 MB</p>
                  </div>
                </div>
                {uploading !== null && uploading !== undefined ? (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Uploading to YouTube…</span>
                      <span>{uploading}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" style={{ width: `${uploading}%` }} />
                    </div>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                    <span className="text-xs px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 group-hover:bg-red-500/18 group-hover:border-red-500/35 transition-all flex items-center gap-1.5 font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Choose video file
                    </span>
                    <input type="file" className="sr-only" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg"
                      onChange={e => { const file = e.target.files?.[0]; if (file) handleYoutubeUpload(mi, li, ci, file); e.target.value = ''; }}
                    />
                  </label>
                )}
                {ytErr && <p className="mt-2.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{ytErr}</p>}
              </div>
            </div>
          )}

          {ct.type === 'file' && (
            <div className="space-y-3">
              {ct.url && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  <a href={ct.url} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:text-amber-300 transition-colors truncate">{ct.filename || ct.url}</a>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">File URL</label>
                <input
                  className="input-dark text-sm"
                  placeholder="https://..."
                  value={ct.url || ''}
                  onChange={e => updateContentItem(mi, li, ci, { url: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs text-slate-600">or upload a file</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                <span className="text-xs px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 group-hover:text-white group-hover:border-white/25 group-hover:bg-white/8 transition-all flex items-center gap-1.5 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Choose file
                </span>
                <span className="text-xs text-slate-600">PDF, images, audio, etc.</span>
                <input type="file" className="sr-only" accept="*/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(mi, li, f); }} />
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-3">
        {([
          { n: 1, label: 'Course Details',   desc: 'Title, description & access' },
          { n: 2, label: 'Curriculum',        desc: 'Modules, lessons & content' },
        ] as const).map(({ n, label, desc }, idx) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-3">
              <button
                onClick={() => { if (n === 2 && step1Errors.length > 0) return; setStep(n); }}
                className="flex items-center gap-2.5 group"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done   ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' :
                  active ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' :
                           'bg-white/5 border-white/15 text-slate-500'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : n}
                </span>
                <div className="text-left hidden sm:block">
                  <p className={`text-sm font-semibold leading-tight transition-colors ${active ? 'text-white' : done ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                  <p className="text-xs text-slate-600 leading-tight">{desc}</p>
                </div>
              </button>
              {idx === 0 && (
                <div className="flex items-center gap-0.5 mx-1">
                  <div className="w-5 h-px bg-white/15" /><div className="w-5 h-px bg-white/8" /><div className="w-5 h-px bg-white/4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Course Details ── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="glass-card p-6 space-y-5">

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-300">Course Title <span className="text-red-400">*</span></label>
                <span className={`text-xs font-mono transition-colors ${titleLen >= 10 ? 'text-emerald-500' : titleLen > 0 ? 'text-amber-500' : 'text-slate-600'}`}>{titleLen}/10+</span>
              </div>
              <input
                className="input-dark"
                value={local.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="e.g. Complete Guitar for Beginners — From Zero to First Song"
              />
              {titleLen > 0 && titleLen < 10 && (
                <p className="mt-1.5 text-xs text-amber-500/80">Need {10 - titleLen} more character{10 - titleLen !== 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-300">Description <span className="text-red-400">*</span></label>
                <span className={`text-xs font-mono transition-colors ${descLen >= 50 ? 'text-emerald-500' : descLen > 0 ? 'text-amber-500' : 'text-slate-600'}`}>{descLen}/50+</span>
              </div>
              <textarea
                className="input-dark resize-none"
                rows={5}
                value={local.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="What will students learn? Who is this for? What makes this course unique? (min. 50 characters)"
              />
              <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${descLen >= 50 ? 'bg-emerald-500' : 'bg-amber-500/70'}`}
                  style={{ width: `${Math.min(100, (descLen / 50) * 100)}%` }}
                />
              </div>
            </div>

            {/* Access Tier */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">Access Tier</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'free',    label: 'Free',    desc: 'Open to all students',  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                    </svg>
                  )},
                  { value: 'premium', label: 'Premium', desc: 'Subscribers only',      icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )},
                ] as const).map(({ value, label, desc, icon }) => (
                  <button
                    key={value}
                    onClick={() => updateField('accessTier', value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      local.accessTier === value
                        ? 'bg-purple-600/15 border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'bg-white/3 border-white/8 hover:border-white/18 hover:bg-white/5'
                    }`}
                  >
                    <span className={local.accessTier === value ? 'text-purple-400' : 'text-slate-500'}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${local.accessTier === value ? 'text-white' : 'text-slate-400'}`}>{label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${local.accessTier === value ? 'border-purple-500 bg-purple-500' : 'border-white/20'}`}>
                      {local.accessTier === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Tags <span className="text-slate-600 font-normal text-xs ml-1">optional</span></label>
              <div className="relative">
                <input
                  className="input-dark pr-24"
                  placeholder="e.g. guitar, beginner, music theory"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); } }}
                  onBlur={commitTag}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 pointer-events-none select-none">Enter to add</span>
              </div>
              {(local.tags || []).length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(local.tags || []).map(t => (
                    <span key={t} className="tag-chip flex items-center gap-1.5">
                      {t}
                      <button onClick={() => updateField('tags', (local.tags || []).filter(x => x !== t))} className="text-slate-500 hover:text-red-400 transition-colors" aria-label={`Remove ${t}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              disabled={step1Errors.length > 0}
              className="btn-primary !py-3 !px-6 disabled:opacity-40 flex items-center gap-2"
            >
              Continue to Curriculum
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button onClick={onCancel} className="btn-ghost !py-3 !px-5">Cancel</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Curriculum ── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in-up">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">Curriculum Builder</h3>
              <p className="text-xs text-slate-500 mt-0.5">Modules → Lessons → Content blocks. Click a module to expand it.</p>
            </div>
            <button onClick={addModule} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-1.5 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Module
            </button>
          </div>

          {/* Empty state */}
          {(local.modules || []).length === 0 && (
            <div className="glass-card p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/15 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-purple-400/80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1.5">Start building your curriculum</h3>
              <p className="text-slate-500 text-sm mb-1 max-w-xs leading-relaxed">
                A <span className="text-slate-300 font-medium">module</span> is a section of your course — like a chapter or a week of study.
              </p>
              <p className="text-slate-600 text-xs mb-7 max-w-xs">Each module contains lessons. Each lesson can have text, videos, and file attachments.</p>
              <button onClick={addModule} className="btn-primary flex items-center gap-2 !px-6 !py-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Your First Module
              </button>
            </div>
          )}

          {/* Module list */}
          <div className="space-y-3">
            {(local.modules || []).map((m, mi) => {
              const isOpen = expandedModules[mi];
              const lessonCount = (m.lessons || []).length;
              return (
                <div key={mi} className="rounded-2xl border border-white/8 bg-white/[0.035] overflow-hidden">

                  {/* Module header — click to expand/collapse */}
                  <div
                    role="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedModules(prev => ({ ...prev, [mi]: !prev[mi] }))}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.025] transition-colors select-none"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/40 to-purple-800/20 border border-purple-500/25 flex items-center justify-center text-purple-300 text-sm font-bold shrink-0">
                      {mi + 1}
                    </div>

                    <input
                      className="flex-1 bg-transparent text-white font-semibold text-sm placeholder-slate-600 outline-none min-w-0"
                      value={m.title}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateModule(mi, { title: e.target.value })}
                      placeholder="Module title — e.g. Week 1: Foundations"
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      {lessonCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/8 text-slate-500 font-medium">
                          {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (window.confirm(`Remove "${m.title || `Module ${mi + 1}`}" and all its lessons?`)) removeModule(mi);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        aria-label="Delete module"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Lessons */}
                  {isOpen && (
                    <div className="border-t border-white/5">
                      {(m.lessons || []).length === 0 && (
                        <div className="px-6 py-5 text-center">
                          <p className="text-xs text-slate-600 mb-2">No lessons yet in this module.</p>
                          <button onClick={() => addLesson(mi)} className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-1 mx-auto">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add first lesson
                          </button>
                        </div>
                      )}

                      {(m.lessons || []).map((l, li) => {
                        const lkey = `${mi}-${li}`;
                        const isLessonOpen = expandedLessons[lkey];
                        const contentCount = ((l as any).contents || []).length;
                        return (
                          <div key={li} className="border-b border-white/[0.04] last:border-b-0">
                            {/* Lesson row */}
                            <div className="flex items-center gap-3 pl-6 pr-4 py-2.5 bg-white/[0.018] hover:bg-white/[0.03] transition-colors">
                              <span className="w-6 h-6 rounded-md bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 text-xs font-medium shrink-0">{li + 1}</span>
                              <input
                                className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-700 outline-none min-w-0"
                                value={l.title}
                                onChange={e => updateLesson(mi, li, { title: e.target.value })}
                                placeholder="Lesson title — e.g. Introduction to Chord Shapes"
                              />
                              {contentCount > 0 && (
                                <span className="text-xs text-slate-700 shrink-0">{contentCount} block{contentCount !== 1 ? 's' : ''}</span>
                              )}
                              <button
                                onClick={() => setExpandedLessons(prev => ({ ...prev, [lkey]: !prev[lkey] }))}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                                  isLessonOpen
                                    ? 'bg-purple-600/15 border-purple-500/30 text-purple-400'
                                    : 'bg-white/4 border-white/10 text-slate-500 hover:text-slate-200 hover:border-white/20'
                                }`}
                              >
                                {isLessonOpen ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Done
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                    {contentCount > 0 ? 'Edit content' : 'Add content'}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => { if (window.confirm(`Remove "${l.title || `Lesson ${li + 1}`}"?`)) removeLesson(mi, li); }}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:text-red-400 transition-colors shrink-0"
                                aria-label="Delete lesson"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>

                            {/* Lesson content editor */}
                            {isLessonOpen && (
                              <div className="mx-4 mb-4 mt-2 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-px flex-1 bg-purple-500/15" />
                                  <span className="text-xs text-purple-400/60 font-medium">Content Blocks</span>
                                  <div className="h-px flex-1 bg-purple-500/15" />
                                </div>

                                {contentCount === 0 && (
                                  <p className="text-center text-xs text-slate-700 py-2">No content yet — add a block below.</p>
                                )}

                                {((l as any).contents || []).map((ct: ContentItem, ci: number) =>
                                  renderContentBlock(ct, mi, li, ci)
                                )}

                                {/* Add content block */}
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                  {([
                                    { type: 'text'  as const, label: '+ Text Block',  hoverCls: 'hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5',
                                      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg> },
                                    { type: 'video' as const, label: '+ Video',       hoverCls: 'hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5',
                                      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
                                    { type: 'file'  as const, label: '+ Attachment',  hoverCls: 'hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/5',
                                      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg> },
                                  ]).map(({ type, label, hoverCls, icon }) => (
                                    <button
                                      key={type}
                                      onClick={() => addContentItem(mi, li, type)}
                                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 bg-white/[0.02] text-slate-600 text-xs font-medium transition-all ${hoverCls}`}
                                    >
                                      {icon}{label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add lesson button */}
                      <button
                        onClick={() => addLesson(mi)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-600 hover:text-purple-400 hover:bg-purple-500/5 transition-all border-t border-white/5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Lesson to {m.title || `Module ${mi + 1}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation errors */}
          {step2Errors.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 space-y-1.5">
              <p className="text-xs font-semibold text-amber-400 mb-2">Fix before saving:</p>
              {step2Errors.map((e, i) => (
                <p key={i} className="text-xs text-amber-400/80 flex items-start gap-2">
                  <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {e}
                </p>
              ))}
            </div>
          )}

          {/* Status picker */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">
                  {local.status === 'published' ? 'Course is Published' : local.status === 'archived' ? 'Course is Archived' : 'Saving as Draft'}
                </p>
                <p className="text-xs text-slate-500">
                  {local.status === 'published' ? 'Students can see and enroll.' : local.status === 'archived' ? 'Hidden from students. Can be re-published anytime.' : 'Invisible to students until you publish.'}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
                {(['draft', 'published', 'archived'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => updateField('status', s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                      local.status === s
                        ? s === 'published' ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30'
                        : s === 'archived'  ? 'bg-red-600/15 text-red-400 border border-red-500/20'
                        :                     'bg-white/10 text-white border border-white/15'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost !py-2.5 !px-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
            <button
              onClick={() => onSave(normalizeBeforeSave(local))}
              disabled={saving || allErrors.length > 0}
              className="btn-primary !py-2.5 !px-6 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Save Course</>
              )}
            </button>
            <button onClick={onCancel} className="text-sm text-slate-600 hover:text-slate-400 transition-colors ml-auto">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
