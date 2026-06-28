import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as courseApi from '../api/courseApi';
import * as enrollmentApi from '../api/enrollmentApi';
import * as qnaApi from '../api/qnaApi';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';

type ContentItem = {
  type: 'text' | 'video' | 'file' | string;
  text?: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* not a valid URL */ }
  return null;
}

export default function StudentCoursePlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { appUser } = useAuth();

  const [course, setCourse] = useState<any | null>(null);
  const [lesson, setLesson] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [qnaLoading, setQnaLoading] = useState(false);
  const THREADS_PER_PAGE = 5;
  const [threadPage, setThreadPage] = useState<number>(1);
  const [threadsMeta, setThreadsMeta] = useState<{ totalRoots: number; page: number; limit: number; totalPages: number } | null>(null);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  type QnaItem = {
    _id: string; courseId: string; lessonId: string;
    authorId?: { _id: string; username?: string; email?: string; profile?: { picUrl?: string } } | string;
    parentId?: string | null; content: string; createdAt?: string; updatedAt?: string; deleted?: boolean;
  };
  const [qna, setQna] = useState<QnaItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const VISIBLE_LEVELS = 2;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const c = await courseApi.getCourse(courseId);
        if (!mounted) return;
        setCourse(c);

        let found: any = null;
        for (const mod of (c.modules || [])) {
          for (const l of (mod.lessons || [])) {
            if (l && l.lessonId && l.lessonId.toString() === lessonId) { found = { ...l, module: mod }; break; }
          }
          if (found) break;
        }
        if (!found) {
          for (const mod of (c.modules || [])) {
            for (const l of (mod.lessons || [])) {
              if (l && (l.contents || []).length) { found = { ...l, module: mod }; break; }
            }
            if (found) break;
          }
        }
        setLesson(found || null);

        if (appUser) {
          const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
          if (!mounted) return;
          setEnrollment((en && en[0]) || null);
        }
      } catch (err) { console.error('Failed to load lesson', err); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [courseId, lessonId, appUser]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) return;
      const lessonKey = (lesson && lesson.lessonId) ? lesson.lessonId.toString() : (lessonId || '');
      if (!lessonKey) return;
      setQnaLoading(true);
      try {
        const resp: any = await qnaApi.listQna(courseId, lessonKey, threadPage, THREADS_PER_PAGE);
        if (!mounted) return;
        setQna(resp.items || []);
        setThreadsMeta(resp.meta || null);
      } catch { /* ignore */ }
      finally { if (mounted) setQnaLoading(false); }
    })();
    return () => { mounted = false; };
  }, [courseId, lessonId, lesson, threadPage]);

  useEffect(() => {
    if (threadsMeta && threadPage > threadsMeta.totalPages) setThreadPage(Math.max(1, threadsMeta.totalPages));
  }, [threadsMeta, threadPage]);

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMsg(msg); setNotificationType(type); setNotificationOpen(true);
  };

  const markComplete = async () => {
    if (!courseId || !lesson) return;
    try {
      await enrollmentApi.updateProgress(courseId, lesson.lessonId, true);
      showNotification('Marked lesson complete', 'success');
      const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
      setEnrollment((en && en[0]) || null);
    } catch (err: any) { showNotification('Failed to mark complete: ' + (err?.response?.data?.error || err.message || err), 'error'); }
  };

  const unmarkComplete = async () => {
    if (!courseId || !lesson) return;
    try {
      await enrollmentApi.updateProgress(courseId, lesson.lessonId, false);
      showNotification('Marked lesson not completed', 'info');
      const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
      setEnrollment((en && en[0]) || null);
    } catch (err: any) { showNotification('Failed to unmark complete: ' + (err?.response?.data?.error || err.message || err), 'error'); }
  };

  const findNextLesson = () => {
    if (!course || !lesson) return null;
    let foundCurrent = false;
    for (const mod of (course.modules || [])) {
      for (const l of (mod.lessons || [])) {
        if (!l || !(l.contents || []).length) continue;
        if (!foundCurrent) {
          if (l.lessonId && lesson.lessonId && l.lessonId.toString() === lesson.lessonId.toString()) foundCurrent = true;
        } else { if (l.lessonId) return l.lessonId.toString(); }
      }
    }
    return null;
  };

  const goNext = () => {
    const next = findNextLesson();
    if (next) navigate(`/student/courses/${courseId}/lesson/${next}`);
    else showNotification('No more lessons', 'info');
  };

  const refreshQna = async () => {
    if (!courseId) return;
    const lessonKey = (lesson && lesson.lessonId) ? lesson.lessonId.toString() : (lessonId || '');
    if (!lessonKey) return;
    const resp: any = await qnaApi.listQna(courseId, lessonKey, threadPage, THREADS_PER_PAGE);
    setQna(resp.items || []); setThreadsMeta(resp.meta || null);
  };

  const postQuestion = async () => {
    if (!courseId) return;
    const lessonKey = (lesson && lesson.lessonId) ? lesson.lessonId.toString() : (lessonId || '');
    if (!lessonKey) return;
    if (!appUser) { showNotification('Please sign in to post a question.', 'error'); return; }
    if (!newQuestion.trim()) { showNotification('Question cannot be empty.', 'error'); return; }
    try {
      await qnaApi.postQna(courseId, lessonKey, newQuestion.trim());
      setNewQuestion(''); setThreadPage(1); await refreshQna();
      showNotification('Question posted.', 'success');
    } catch (err: any) { showNotification('Failed to post question: ' + (err?.response?.data?.error || err.message || err), 'error'); }
  };

  const postReply = async (parentId: string) => {
    if (!courseId) return;
    const lessonKey = (lesson && lesson.lessonId) ? lesson.lessonId.toString() : (lessonId || '');
    if (!lessonKey) return;
    if (!appUser) { showNotification('Please sign in to reply.', 'error'); return; }
    const content = (replyDrafts[parentId] || '').trim();
    if (!content) { showNotification('Reply cannot be empty.', 'error'); return; }
    try {
      await qnaApi.postQna(courseId, lessonKey, content, parentId);
      setReplyDrafts(prev => ({ ...prev, [parentId]: '' }));
      setReplyOpen(prev => { const { [parentId]: _, ...rest } = prev; return rest; });
      await refreshQna(); showNotification('Reply posted.', 'success');
    } catch (err: any) { showNotification('Failed to post reply: ' + (err?.response?.data?.error || err.message || err), 'error'); }
  };

  const roots = useMemo(() => qna.filter(i => !i.parentId), [qna]);
  const childrenById = useMemo(() => {
    const map: Record<string, QnaItem[]> = {};
    for (const item of qna) {
      const pid = item.parentId ? item.parentId.toString() : '';
      if (pid) { if (!map[pid]) map[pid] = []; map[pid].push(item); }
    }
    return map;
  }, [qna]);

  const subtreeInfo = useMemo(() => {
    const info: Record<string, { maxDepth: number; totalDescendants: number }> = {};
    const dfs = (id: string): { maxDepth: number; totalDescendants: number } => {
      const children = childrenById[id] || [];
      let max = 0, count = 0;
      for (const c of children) { const r = dfs(c._id); count += 1 + r.totalDescendants; max = Math.max(max, 1 + r.maxDepth); }
      info[id] = { maxDepth: max, totalDescendants: count };
      return info[id];
    };
    for (const r of qna) { if (!info[r._id]) dfs(r._id); }
    return info;
  }, [childrenById, qna]);

  const renderQnaNode = (node: QnaItem, level = 0, rootId?: string, maxDepth: number = Infinity): React.ReactNode => {
    const authorObj = (typeof node.authorId === 'object' && node.authorId) ? (node.authorId as any) : null;
    const authorLabel = authorObj ? (authorObj.username || authorObj.email || 'User') : 'User';
    const courseInstructorId = course && course.instructorId ? (typeof course.instructorId === 'object' ? course.instructorId._id : course.instructorId) : null;
    const isInstructorPost = !!(authorObj && (authorObj.role === 'instructor' || (courseInstructorId && String(courseInstructorId) === String(authorObj._id))));
    const isRoot = level === 0;
    const created = node.createdAt ? new Date(node.createdAt).toLocaleString() : '';
    const children = childrenById[node._id] || [];
    const isAuthor = appUser && ((typeof node.authorId === 'object' && node.authorId && (node.authorId as any)._id === appUser._id) || (typeof node.authorId === 'string' && node.authorId === appUser._id));
    const instructorId = (course && (course.instructorId && (typeof course.instructorId === 'object' ? course.instructorId._id : course.instructorId))) || '';
    const isOwner = appUser && instructorId && String(instructorId) === String(appUser._id);
    const isAdmin = appUser && appUser.role === 'admin';
    const canModerate = !!(isAdmin || isOwner);
    const canEdit = !!(isAuthor || canModerate);
    const canDelete = !!(isAuthor || canModerate);
    const isEditing = editDrafts.hasOwnProperty(node._id);

    return (
      <li key={node._id} className="list-none">
        <div className={`p-4 rounded-xl ${isRoot ? 'bg-purple-600/8 border border-purple-500/15' : 'bg-white/3 border border-white/5'} ${isInstructorPost ? 'ring-1 ring-blue-500/20' : ''}`}>
          <div className="flex items-start gap-3">
            {authorObj?.profile?.picUrl ? (
              <img src={authorObj.profile.picUrl} alt={authorLabel} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {(authorLabel || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <span className="text-white text-sm font-semibold">{authorLabel}</span>
                {isInstructorPost && <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold">Instructor</span>}
                {isRoot && <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-600/30 border border-purple-500/30 text-purple-300 font-semibold">Question</span>}
                {created && <span className="text-slate-600 text-xs">{created}</span>}

                <div className="ml-auto flex items-center gap-2 text-xs">
                  {canEdit && !node.deleted && !isEditing && (
                    <button className="text-slate-500 hover:text-purple-400 transition-colors" onClick={() => setEditDrafts(prev => ({ ...prev, [node._id]: node.content || '' }))}>Edit</button>
                  )}
                  {isEditing && (
                    <>
                      <button className="text-emerald-400 hover:text-emerald-300 transition-colors" onClick={async () => {
                        const draft = (editDrafts[node._id] || '').trim();
                        if (!draft) { showNotification('Content cannot be empty.', 'error'); return; }
                        try {
                          await qnaApi.updateQna(node._id, draft);
                          setEditDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; });
                          await refreshQna(); showNotification('Updated.', 'success');
                        } catch (err: any) { showNotification('Failed to update: ' + (err?.response?.data?.error || err.message || err), 'error'); }
                      }}>Save</button>
                      <button className="text-slate-500 hover:text-white transition-colors" onClick={() => setEditDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; })}>Cancel</button>
                    </>
                  )}
                  {canDelete && !node.deleted && (
                    <button className="text-red-400/50 hover:text-red-400 transition-colors" onClick={async () => {
                      if (!window.confirm('Delete this message?')) return;
                      try {
                        await qnaApi.deleteQna(node._id); await refreshQna(); showNotification('Deleted.', 'success');
                      } catch (err: any) { showNotification('Failed to delete: ' + (err?.response?.data?.error || err.message || err), 'error'); }
                    }}>Delete</button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <textarea className="input-dark resize-none text-sm w-full" rows={2} value={editDrafts[node._id] || ''} onChange={e => setEditDrafts(prev => ({ ...prev, [node._id]: e.target.value }))} />
              ) : (
                <>
                  {node.deleted ? (
                    <span className="italic text-slate-600 text-sm">[deleted]</span>
                  ) : (
                    <>
                      <div
                        className="text-slate-300 text-sm leading-relaxed"
                        style={(!showMore[node._id] && node.content && (node.content.length > 150 || (node.content.match(/\n/g) || []).length > 1)) ? {
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        } as any : {}}
                      >
                        {node.content}
                      </div>
                      {node.content && (node.content.length > 150 || (node.content.match(/\n/g) || []).length > 1) && (
                        <button className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors" onClick={() => setShowMore(prev => ({ ...prev, [node._id]: !prev[node._id] }))}>
                          {showMore[node._id] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="mt-2 flex justify-end">
                {!replyOpen[node._id] ? (
                  <button className="text-xs text-slate-500 hover:text-purple-400 transition-colors" onClick={() => {
                    if (!appUser) { showNotification('Please sign in to reply.', 'error'); return; }
                    setReplyOpen(prev => ({ ...prev, [node._id]: true }));
                  }}>↩ Reply</button>
                ) : (
                  <div className="w-full space-y-2 mt-2">
                    <input className="input-dark text-sm !py-2" placeholder="Write a reply…" value={replyDrafts[node._id] || ''} onChange={e => setReplyDrafts(prev => ({ ...prev, [node._id]: e.target.value }))} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => postReply(node._id)} disabled={!(replyDrafts[node._id] || '').trim()} className="btn-primary text-xs !py-1.5 !px-4 disabled:opacity-50">Post</button>
                      <button onClick={() => { setReplyOpen(prev => { const { [node._id]: _, ...rest } = prev; return rest; }); setReplyDrafts(prev => ({ ...prev, [node._id]: '' })); }} className="btn-ghost text-xs !py-1.5 !px-3">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {children.length > 0 && (
          <>
            {level < maxDepth ? (
              <ul className="mt-2 space-y-2 pl-4 border-l border-white/5 ml-4">
                {children.map(child => renderQnaNode(child, level + 1, rootId, maxDepth))}
              </ul>
            ) : (() => {
              const nodeInfo = subtreeInfo[node._id] || { totalDescendants: 0 };
              return nodeInfo.totalDescendants > 0 && rootId ? (
                <div className="mt-2 pl-4 ml-4">
                  <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors" onClick={() => setExpandedThreads(prev => ({ ...prev, [rootId]: true }))}>
                    Show {nodeInfo.totalDescendants} more repl{nodeInfo.totalDescendants > 1 ? 'ies' : 'y'}
                  </button>
                </div>
              ) : null;
            })()}
            {rootId && expandedThreads[rootId] && level === (VISIBLE_LEVELS - 1) && (() => {
              const nodeInfo = subtreeInfo[node._id] || { totalDescendants: 0 };
              return nodeInfo.totalDescendants > 0 ? (
                <div className="mt-1 pl-4 ml-4">
                  <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors" onClick={() => setExpandedThreads(prev => ({ ...prev, [rootId]: false }))}>
                    Collapse replies
                  </button>
                </div>
              ) : null;
            })()}
          </>
        )}
      </li>
    );
  };

  if (loading) return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    </main>
  );

  if (!course || !lesson) return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4 flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <p className="text-slate-400">Lesson not found or course has no playable lessons.</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm mt-4">Go Back</button>
      </div>
    </main>
  );

  const completedIds = (enrollment && enrollment.progress && Array.isArray(enrollment.progress.completedLessons))
    ? enrollment.progress.completedLessons.map((id: any) => id.toString()) : [];
  const isCompleted = lesson.lessonId && completedIds.includes(lesson.lessonId.toString());

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <main className="pt-8 pb-16 px-4 max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Lesson content card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-slate-500 text-xs mb-1">{lesson.module?.title}</div>
              <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
              <div className="text-slate-400 text-sm mt-1">{course.title}</div>
            </div>
            {isCompleted && (
              <span className="tag-chip !bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400 shrink-0">
                <svg className="inline-block w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Completed
              </span>
            )}
          </div>

          <div className="section-divider my-5" />

          {/* Content items */}
          <div className="space-y-6">
            {(lesson.contents || []).map((c: ContentItem, i: number) => (
              <div key={i}>
                {c.type === 'text' && (
                  <div className="text-slate-300 leading-relaxed prose-dark" dangerouslySetInnerHTML={{ __html: c.text || '' }} />
                )}
                {c.type === 'video' && c.url && (() => {
                  const embedUrl = getEmbedUrl(c.url);
                  return embedUrl ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video lesson"
                      />
                    </div>
                  ) : (
                    <video controls className="w-full rounded-2xl bg-black border border-white/10">
                      <source src={c.url} />
                      Your browser does not support the video tag.
                    </video>
                  );
                })()}
                {c.type === 'file' && c.url && (
                  <a
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:text-purple-300 hover:bg-white/8 transition-all"
                    href={c.url} target="_blank" rel="noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {c.filename || 'Download file'}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-5 border-t border-white/10 flex items-center gap-3 flex-wrap">
            {!isCompleted ? (
              <button onClick={markComplete} className="btn-primary text-sm !py-2.5 !px-5">
                <svg className="inline-block w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Mark as Complete
              </button>
            ) : (
              <button onClick={unmarkComplete} className="btn-ghost text-sm !py-2.5 !px-5 text-emerald-400 border-emerald-500/20">
                <svg className="inline-block w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Completed
              </button>
            )}

            <button onClick={goNext} className="btn-ghost text-sm !py-2.5 !px-5">
              Next Lesson
              <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Discussion
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {qnaLoading && <span className="animate-pulse">Loading…</span>}
              <span>{threadsMeta ? `${threadsMeta.totalRoots} posts` : `${roots.length} posts`}</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs mb-5">Ask questions about this lesson and discuss with peers and your instructor.</p>

          {/* Composer */}
          <div className="flex items-start gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {appUser ? (appUser.username?.charAt(0) || appUser.email?.charAt(0) || 'U').toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <input
                className="input-dark text-sm !py-2"
                placeholder={appUser ? 'Ask a question about this lesson…' : 'Sign in to ask a question'}
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                disabled={!appUser}
              />
              <div className="mt-2 flex justify-end">
                <button onClick={postQuestion} disabled={!appUser || !newQuestion.trim()} className="btn-primary text-xs !py-1.5 !px-4 disabled:opacity-50">
                  Post Question
                </button>
              </div>
            </div>
          </div>

          {/* Thread list */}
          {roots.length === 0 && !qnaLoading && (
            <p className="text-slate-600 text-sm text-center py-4">No questions yet. Be the first to ask!</p>
          )}

          <ul className="space-y-3">
            {roots.map(t => {
              const info = subtreeInfo[t._id] || { maxDepth: 0 };
              const needsCollapse = info.maxDepth > VISIBLE_LEVELS && !expandedThreads[t._id];
              const maxDepth = needsCollapse ? (VISIBLE_LEVELS - 1) : Infinity;
              return renderQnaNode(t, 0, t._id, maxDepth);
            })}
          </ul>

          {/* Pagination */}
          {threadsMeta && threadsMeta.totalRoots > THREADS_PER_PAGE && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={() => setThreadPage(p => Math.max(1, p - 1))} disabled={threadPage <= 1} className="btn-ghost text-sm !py-1.5 !px-4 disabled:opacity-40">← Prev</button>
              <span className="text-slate-500 text-sm">Page {threadsMeta.page} of {threadsMeta.totalPages}</span>
              <button onClick={() => setThreadPage(p => Math.min(threadsMeta.totalPages, p + 1))} disabled={threadPage >= threadsMeta.totalPages} className="btn-ghost text-sm !py-1.5 !px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      </main>

      <Notification open={notificationOpen} message={notificationMsg} type={notificationType} onClose={() => setNotificationOpen(false)} duration={4000} />
    </div>
  );
}
