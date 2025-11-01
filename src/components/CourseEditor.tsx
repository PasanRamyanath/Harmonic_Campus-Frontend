import { useEffect, useState } from 'react';
import * as courseApi from '../api/courseApi';

  type ContentItem = { type?: 'text' | 'video' | 'file'; text?: string; url?: string; filename?: string; mimeType?: string; size?: number };
type Lesson = { lessonId?: string; title: string; order?: number; contents?: ContentItem[] };
type Module = { moduleId?: string; title: string; order?: number; lessons: Lesson[] };
type Course = { _id?: string; title: string; description: string; accessTier: string; status: string; tags?: string[]; modules?: Module[] };

export default function CourseEditor({ course, onCancel, onSave, saving }: { course: Course; onCancel: () => void; onSave: (c: Course) => void; saving: boolean }) {
  const [local, setLocal] = useState<Course>({ ...course });
  const [tagsInput, setTagsInput] = useState<string>((course.tags || []).join(', '));

  useEffect(() => setLocal({ ...course }), [course]);
  // sync tags input when course prop changes
  useEffect(() => {
    setTagsInput(((course && course.tags) || []).join(', '));
  }, [course]);

  const updateField = (k: keyof Course, v: any) => setLocal(prev => ({ ...prev, [k]: v }));

  const normalizeBeforeSave = (c: Course): Course => {
    const out: Course = { ...c };
    out.tags = (out.tags || []).map(t => String(t).trim()).filter(Boolean);
    out.modules = (out.modules || []).map((m, mi) => ({
      ...m,
      order: mi + 1,
      lessons: (m.lessons || []).map((l, li) => ({
        ...l,
        order: li + 1,
        contents: (l.contents || []).map(ct => ({
          // normalize legacy 'pdf' type to 'file' and keep other fields
          ...(ct || {}),
          type: (ct as any)?.type === 'pdf' ? 'file' : (ct as any)?.type
        }))
      }))
    }));
    return out;
  };

  const validate = (c: Course) => {
    const errors: string[] = [];
    const title = (c.title || '').trim();
    const desc = (c.description || '').trim();
    if (title.length < 10) errors.push('Title must be at least 10 characters.');
    if (desc.length < 50) errors.push('Description must be at least 50 characters.');
    (c.modules || []).forEach((m, mi) => {
      if (!m.title || String(m.title).trim().length < 3) errors.push(`Module ${mi + 1} title too short.`);
      (m.lessons || []).forEach((l, li) => {
        if (!l.title || String(l.title).trim().length < 3) errors.push(`Lesson ${mi + 1}.${li + 1} title too short.`);
      });
    });
    return errors;
  };

  const addModule = () => {
    const m: Module = { title: 'New Module', order: (local.modules?.length || 0) + 1, lessons: [] };
    updateField('modules', [...(local.modules || []), m]);
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
    const lessons = modules[mIdx].lessons || [];
    lessons.push({ title: 'New Lesson', order: lessons.length + 1, contents: [{ type: 'text', text: '' }] });
    modules[mIdx].lessons = lessons;
    updateField('modules', modules);
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
      // append file content with metadata
      const modules = [...(local.modules || [])];
      const lessons = [...(modules[mIdx].lessons || [])];
      const lesson = { ...(lessons[lIdx] || {} as any) } as any;
      const contents = [...(lesson.contents || [])];
      const fileMeta = { type: 'file', url: res.url, filename: res.originalName || res.filename, mimeType: res.mimeType, size: res.size };
      // If there's an existing empty file placeholder (type 'file' with no url/filename), fill it instead of appending
      const placeholderIdx = contents.findIndex((it: any) => it?.type === 'file' && !(it.url || it.filename));
      if (placeholderIdx >= 0) {
        contents[placeholderIdx] = { ...contents[placeholderIdx], ...fileMeta };
      } else {
        contents.push(fileMeta);
      }
      lesson.contents = contents;
      lessons[lIdx] = lesson;
      modules[mIdx].lessons = lessons;
      updateField('modules', modules);
    } catch (err) {
      console.error('Upload failed', err);
      alert('File upload failed');
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input className="mt-1 w-full rounded border p-2" value={local.title} onChange={e => updateField('title', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Access Tier</label>
          <select className="mt-1 w-full rounded border p-2" value={local.accessTier} onChange={e => updateField('accessTier', e.target.value)}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select className="mt-1 w-full rounded border p-2" value={local.status || 'draft'} onChange={e => updateField('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">Description</label>
        <textarea className="mt-1 w-full rounded border p-2" rows={4} value={local.description} onChange={e => updateField('description', e.target.value)} />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">Tags</label>
        <div className="mt-1">
          <input
            className="w-full rounded border p-2"
            placeholder="Type a tag and press Enter"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const raw = tagsInput.trim();
                if (!raw) return;
                // Only treat the whole input as a single tag when Enter is pressed.
                const parts = [raw];
                const merged = Array.from(new Set([...(local.tags || []), ...parts.map(s => s.trim()).filter(Boolean)]));
                updateField('tags', merged);
                setTagsInput('');
              }
            }}
            onBlur={() => {
              const raw = tagsInput.trim();
              if (!raw) {
                setTagsInput(((local.tags || [])).join(', '));
                return;
              }
              // On blur, also treat input as a single tag (do not split on comma)
              const parts = [raw];
              const merged = Array.from(new Set([...(local.tags || []), ...parts.map(s => s.trim()).filter(Boolean)]));
              updateField('tags', merged);
              setTagsInput(((merged || [])).join(', '));
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {(local.tags || []).map(t => (
              <span key={t} className="inline-flex items-center bg-gray-100 text-sm text-gray-800 px-2 py-1 rounded">
                {t}
                <button className="ml-2 text-red-500" onClick={() => updateField('tags', (local.tags || []).filter(x => x !== t))} aria-label={`Remove ${t}`}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Modules</h3>
          <div className="space-x-2">
            <button onClick={addModule} className="px-2 py-1 bg-green-600 text-white rounded">Add Module</button>
          </div>
        </div>

        <div className="space-y-4 mt-3">
          {(local.modules || []).map((m, mi) => (
            <div key={mi} className="border rounded p-3 bg-white">
              <div className="flex items-center justify-between">
                <input className="font-semibold text-lg" value={m.title} onChange={e => updateModule(mi, { title: e.target.value })} />
                <div className="space-x-2">
                  <button onClick={() => addLesson(mi)} className="px-2 py-1 bg-blue-600 text-white rounded">Add Lesson</button>
                  <button onClick={() => removeModule(mi)} className="px-2 py-1 bg-red-600 text-white rounded">Remove Module</button>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {(m.lessons || []).map((l, li) => (
                  <div key={li} className="border p-2 rounded">
                    <div className="flex items-start justify-between">
                      <input className="flex-1 mr-2" value={l.title} onChange={e => updateLesson(mi, li, { title: e.target.value })} />
                      <button onClick={() => removeLesson(mi, li)} className="px-2 py-1 bg-red-500 text-white rounded">Remove</button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {((l as any).contents || []).map((ct: ContentItem, ci: number) => (
                        <div key={ci} className="p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <select value={ct.type} onChange={e => {
                              const newContents = [...((l as any).contents || [])];
                              newContents[ci] = { ...newContents[ci], type: e.target.value as any };
                              updateLesson(mi, li, { contents: newContents } as any);
                            }} className="rounded border p-1">
                              <option value="text">Text</option>
                              <option value="video">Video (YouTube URL)</option>
                              <option value="file">Study Material (file)</option>
                            </select>
                            <button onClick={() => removeContentItem(mi, li, ci)} className="px-2 py-1 bg-red-400 text-white rounded">Remove</button>
                          </div>

                          <div className="mt-2">
                            {ct.type === 'text' && (
                              <textarea className="w-full rounded border p-2" rows={3} value={ct.text || ''} onChange={e => {
                                const newContents = [...((l as any).contents || [])];
                                newContents[ci] = { ...newContents[ci], text: e.target.value };
                                updateLesson(mi, li, { contents: newContents } as any);
                              }} />
                            )}

                            {ct.type === 'video' && (
                              <input className="w-full rounded border p-2" placeholder="https://youtube.com/watch?v=..." value={ct.url || ''} onChange={e => {
                                const newContents = [...((l as any).contents || [])];
                                newContents[ci] = { ...newContents[ci], url: e.target.value };
                                updateLesson(mi, li, { contents: newContents } as any);
                              }} />
                            )}

                            {ct.type === 'file' && (
                              <div>
                                {ct.url ? (
                                  <div><a href={ct.url} target="_blank" rel="noreferrer" className="text-blue-600">{ct.filename || ct.url}</a></div>
                                ) : null}
                                <div className="mt-2 flex items-center gap-2">
                                  <input type="text" className="flex-1 rounded border p-2" placeholder="File URL (or upload below)" value={ct.url || ''} onChange={e => {
                                    const newContents = [...((l as any).contents || [])];
                                    newContents[ci] = { ...newContents[ci], url: e.target.value };
                                    updateLesson(mi, li, { contents: newContents } as any);
                                  }} />
                                  <input type="file" accept="*/*" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(mi, li, file);
                                  }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => addContentItem(mi, li, 'text')} className="px-2 py-1 bg-gray-200 rounded">Add Text</button>
                        <button onClick={() => addContentItem(mi, li, 'video')} className="px-2 py-1 bg-gray-200 rounded">Add Video</button>
                        <button onClick={() => addContentItem(mi, li, 'file')} className="px-2 py-1 bg-gray-200 rounded">Add File</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {/** validation messages */}
        {validate(local).length > 0 && (
          <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <ul className="list-disc pl-5 text-sm text-yellow-800">
              {validate(local).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSave(normalizeBeforeSave(local))}
            disabled={saving || validate(local).length > 0}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Course'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}
