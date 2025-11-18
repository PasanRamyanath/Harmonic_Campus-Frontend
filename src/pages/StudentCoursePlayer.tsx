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
    _id: string;
    courseId: string;
    lessonId: string;
    authorId?: { _id: string; username?: string; email?: string; profile?: { picUrl?: string } } | string;
    parentId?: string | null;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    deleted?: boolean;
  };
  const [qna, setQna] = useState<QnaItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const c = await courseApi.getCourse(courseId);
        if (!mounted) return;
        setCourse(c);

        // find lesson by id
        let found: any = null;
        for (const mod of (c.modules || [])) {
          for (const l of (mod.lessons || [])) {
            if (l && l.lessonId && l.lessonId.toString() === lessonId) {
              found = { ...l, module: mod };
              break;
            }
          }
          if (found) break;
        }
        // if no lessonId provided or not found, pick first with contents
        if (!found) {
          for (const mod of (c.modules || [])) {
            for (const l of (mod.lessons || [])) {
              if (l && (l.contents || []).length) { found = { ...l, module: mod }; break; }
            }
            if (found) break;
          }
        }
        setLesson(found || null);

        // fetch enrollment for this course
        if (appUser) {
          const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
          if (!mounted) return;
          setEnrollment((en && en[0]) || null);
        }
      } catch (err) {
        console.error('Failed to load lesson', err);
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, lessonId, appUser]);

  // Load paginated Q&A threads for this lesson
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
        // resp: { items: [], meta: { totalRoots, page, limit, totalPages } }
        setQna(resp.items || []);
        setThreadsMeta(resp.meta || null);
      } catch (err) {
        console.error('Failed to load Q&A', err);
      } finally {
        if (mounted) setQnaLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, lessonId, lesson, threadPage]);

  // If meta changes and current page is out of range, clamp it
  useEffect(() => {
    if (threadsMeta && threadPage > threadsMeta.totalPages) {
      setThreadPage(Math.max(1, threadsMeta.totalPages));
    }
  }, [threadsMeta, threadPage]);

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMsg(msg);
    setNotificationType(type);
    setNotificationOpen(true);
  };

  const markComplete = async () => {
    if (!courseId || !lesson) return;
    try {
      await enrollmentApi.updateProgress(courseId, lesson.lessonId, true);
      showNotification('Marked lesson complete', 'success');
      // refresh enrollment
      const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
      setEnrollment((en && en[0]) || null);
    } catch (err: any) {
      console.error('Failed to mark complete', err);
      showNotification('Failed to mark complete: ' + (err?.response?.data?.error || err.message || err), 'error');
    }
  };

  const unmarkComplete = async () => {
    if (!courseId || !lesson) return;
    try {
      await enrollmentApi.updateProgress(courseId, lesson.lessonId, false);
      showNotification('Marked lesson not completed', 'info');
      // refresh enrollment
      const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
      setEnrollment((en && en[0]) || null);
    } catch (err: any) {
      console.error('Failed to unmark complete', err);
      showNotification('Failed to unmark complete: ' + (err?.response?.data?.error || err.message || err), 'error');
    }
  };

  const findNextLesson = () => {
    if (!course || !lesson) return null;
    let foundCurrent = false;
    for (const mod of (course.modules || [])) {
      for (const l of (mod.lessons || [])) {
        if (!l || !(l.contents || []).length) continue;
        if (!foundCurrent) {
          if (l.lessonId && lesson.lessonId && l.lessonId.toString() === lesson.lessonId.toString()) foundCurrent = true;
        } else {
          // next lesson after current
          if (l.lessonId) return l.lessonId.toString();
        }
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
    setQna(resp.items || []);
    setThreadsMeta(resp.meta || null);
  };

  const postQuestion = async () => {
    if (!courseId) return;
    const lessonKey = (lesson && lesson.lessonId) ? lesson.lessonId.toString() : (lessonId || '');
    if (!lessonKey) return;
    if (!appUser) { showNotification('Please sign in to post a question.', 'error'); return; }
    if (!newQuestion.trim()) { showNotification('Question cannot be empty.', 'error'); return; }
    try {
      await qnaApi.postQna(courseId, lessonKey, newQuestion.trim());
      setNewQuestion('');
      // after posting a new question, go to first page to show latest threads
      setThreadPage(1);
      await refreshQna();
      showNotification('Question posted.', 'success');
    } catch (err: any) {
      console.error('Failed to post question', err);
      showNotification('Failed to post question: ' + (err?.response?.data?.error || err.message || err), 'error');
    }
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
      // close the reply input after successful post
      setReplyOpen(prev => { const { [parentId]: _, ...rest } = prev; return rest; });
      await refreshQna();
      showNotification('Reply posted.', 'success');
    } catch (err: any) {
      console.error('Failed to post reply', err);
      showNotification('Failed to post reply: ' + (err?.response?.data?.error || err.message || err), 'error');
    }
  };

  // Build tree: roots (no parent) and children map for nested replies
  const roots = useMemo(() => qna.filter(i => !i.parentId), [qna]);
  const childrenById = useMemo(() => {
    const map: Record<string, QnaItem[]> = {};
    for (const item of qna) {
      const pid = item.parentId ? item.parentId.toString() : '';
      if (pid) {
        if (!map[pid]) map[pid] = [];
        map[pid].push(item);
      }
    }
    return map;
  }, [qna]);

  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const VISIBLE_LEVELS = 2; // show root + 1 level when collapsed

  // Compute subtree info (max depth under node and total descendants)
  const subtreeInfo = useMemo(() => {
    const info: Record<string, { maxDepth: number; totalDescendants: number }> = {};
    const dfs = (id: string): { maxDepth: number; totalDescendants: number } => {
      const children = childrenById[id] || [];
      let max = 0;
      let count = 0;
      for (const c of children) {
        const r = dfs(c._id);
        count += 1 + r.totalDescendants;
        max = Math.max(max, 1 + r.maxDepth);
      }
      info[id] = { maxDepth: max, totalDescendants: count };
      return info[id];
    };
    // run dfs for every node that appears as a key or root
    for (const r of qna) {
      if (!info[r._id]) dfs(r._id);
    }
    return info;
  }, [childrenById, qna]);

  const renderQnaNode = (node: QnaItem, level = 0, rootId?: string, maxDepth: number = Infinity) => {
  const authorObj = (typeof node.authorId === 'object' && node.authorId) ? (node.authorId as any) : null;
    const authorLabel = authorObj ? (authorObj.username || authorObj.email || 'User') : 'User';
    // mark instructor posts: either the author has role 'instructor' or matches course instructorId
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
      <li key={node._id} className={`${level === 0 ? '' : ''}`}>
  <div className={`flex items-start gap-2 p-2 rounded-md ${isInstructorPost ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'bg-white'} ${isRoot ? 'border-l-4 border-indigo-200' : ''}`}>
          <div className="flex-shrink-0">
            {typeof node.authorId === 'object' && (node.authorId as any).profile && (node.authorId as any).profile.picUrl ? (
              <img src={(node.authorId as any).profile.picUrl} alt={authorLabel} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">{(authorLabel || 'U').charAt(0)}</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium text-gray-800 text-sm">{authorLabel}</span>
                {isInstructorPost && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-semibold">Instructor</span>
                )}
                {isRoot && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-semibold">Question</span>
                )}
                {created && <span className="ml-2 text-xs text-gray-400">• {created}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {(canEdit && !node.deleted && !isEditing) && (
                  <button className="text-indigo-600 hover:underline" onClick={() => setEditDrafts(prev => ({ ...prev, [node._id]: node.content || '' }))}>Edit</button>
                )}
                {isEditing && (
                  <>
                    <button className="text-emerald-600 hover:underline" onClick={async () => {
                      const draft = (editDrafts[node._id] || '').trim();
                      if (!draft) { showNotification('Content cannot be empty.', 'error'); return; }
                      try {
                        await qnaApi.updateQna(node._id, draft);
                        setEditDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; });
                        await refreshQna();
                        showNotification('Updated.', 'success');
                      } catch (err: any) {
                        console.error('Failed to update qna', err);
                        showNotification('Failed to update: ' + (err?.response?.data?.error || err.message || err), 'error');
                      }
                    }}>Save</button>
                    <button className="text-gray-600 hover:underline" onClick={() => setEditDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; })}>Cancel</button>
                  </>
                )}
                {canDelete && !node.deleted && (
                  <button className="text-rose-600 hover:underline" onClick={async () => {
                    const ok = window.confirm('Delete this message? This will hide its content.');
                    if (!ok) return;
                    try {
                      await qnaApi.deleteQna(node._id);
                      await refreshQna();
                      showNotification('Deleted.', 'success');
                    } catch (err: any) {
                      console.error('Failed to delete qna', err);
                      showNotification('Failed to delete: ' + (err?.response?.data?.error || err.message || err), 'error');
                    }
                  }}>Delete</button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-1">
                <textarea className="w-full border rounded p-2 text-sm focus:outline-none focus:ring" rows={2} value={editDrafts[node._id] || ''} onChange={(e) => setEditDrafts(prev => ({ ...prev, [node._id]: e.target.value }))} />
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-800">
                {node.deleted ? (
                  <span className="italic text-gray-400">[deleted]</span>
                ) : (
                  <>
                    <div
                      className="text-sm text-gray-800"
                      style={(!showMore[node._id] && node.content && (node.content.length > 150 || (node.content.match(/\n/g) || []).length > 1)) ? {
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      } : {}}
                    >
                      {node.content}
                    </div>
                    {/* Show more / less */}
                    {node.content && (node.content.length > 150 || (node.content.match(/\n/g) || []).length > 1) && (
                      <div className="mt-1">
                        {!showMore[node._id] ? (
                          <button className="text-xs text-indigo-600 hover:underline" onClick={() => setShowMore(prev => ({ ...prev, [node._id]: true }))}>Show more</button>
                        ) : (
                          <button className="text-xs text-indigo-600 hover:underline" onClick={() => setShowMore(prev => ({ ...prev, [node._id]: false }))}>Show less</button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center justify-end">
              {!replyOpen[node._id] ? (
                <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                  if (!appUser) { showNotification('Please sign in to reply.', 'error'); return; }
                  setReplyOpen(prev => ({ ...prev, [node._id]: true }));
                }}>Reply</button>
              ) : (
                <div className="w-full">
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder={'Write a reply…'} value={replyDrafts[node._id] || ''} onChange={(e) => setReplyDrafts(prev => ({ ...prev, [node._id]: e.target.value }))} />
                  <div className="mt-1 flex justify-end gap-2">
                    <button onClick={() => postReply(node._id)} disabled={!(replyDrafts[node._id] || '').trim()} className={`px-2 py-1 rounded text-xs ${!(replyDrafts[node._id] || '').trim() ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Post</button>
                    <button onClick={() => { setReplyOpen(prev => { const { [node._id]: _, ...rest } = prev; return rest; }); setReplyDrafts(prev => ({ ...prev, [node._id]: '' })); }} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {children.length > 0 && (
          <>
            {level < maxDepth ? (
              <ul className="mt-2 space-y-2 pl-3 border-l border-gray-100">
                {children.map(child => renderQnaNode(child, level + 1, rootId, maxDepth))}
              </ul>
            ) : (
              // collapsed spot: show an expand control if there are deeper descendants
              (() => {
                const nodeInfo = subtreeInfo[node._id] || { totalDescendants: 0, maxDepth: 0 };
                const hidden = nodeInfo.totalDescendants;
                if (hidden > 0 && rootId) {
                  return (
                    <div className="mt-2 text-center">
                      <button
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs border border-indigo-100 shadow-sm hover:bg-indigo-100"
                        onClick={() => setExpandedThreads(prev => ({ ...prev, [rootId]: true }))}
                      >
                        Show {hidden} more repl{hidden > 1 ? 'ies' : 'y'}
                      </button>
                    </div>
                  );
                }
                return null;
              })()
            )}

            {/* When thread is expanded, show a collapse control at the previous boundary level */}
            {rootId && expandedThreads[rootId] && level === (VISIBLE_LEVELS - 1) && (() => {
              const nodeInfo = subtreeInfo[node._id] || { totalDescendants: 0 };
              if (nodeInfo.totalDescendants > 0) {
                return (
                  <div className="mt-1 flex justify-center">
                    <button
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 hover:bg-gray-200"
                      onClick={() => setExpandedThreads(prev => ({ ...prev, [rootId]: false }))}
                    >
                      Collapse replies
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </>
        )}
      </li>
    );
  };

  if (loading) return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">Loading lesson...</main>
  );

  if (!course || !lesson) return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">Lesson not found or course has no playable lessons.</main>
  );

  const completedIds = (enrollment && enrollment.progress && Array.isArray(enrollment.progress.completedLessons))
    ? enrollment.progress.completedLessons.map((id: any) => id.toString()) : [];

  const isCompleted = lesson.lessonId && completedIds.includes(lesson.lessonId.toString());

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-6 p-6 max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex items-center px-3 py-2 mb-4 rounded bg-gray-100 hover:bg-gray-200 text-sm"
        >
          <span className="mr-2">←</span> Back
        </button>
        <div className="bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <div className="text-sm text-gray-600 mt-1">{lesson.title}</div>
          <div className="mt-4">
            { (lesson.contents || []).map((c: ContentItem, i: number) => (
              <div key={i} className="mb-4">
                {c.type === 'text' && <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: c.text || '' }} />}
                {c.type === 'video' && c.url && (
                  <video controls className="w-full rounded bg-black">
                    <source src={c.url} />
                    Your browser does not support the video tag.
                  </video>
                )}
                {c.type === 'file' && c.url && (
                  <a className="text-blue-600 underline" href={c.url} target="_blank" rel="noreferrer">{c.filename || 'Download file'}</a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {!isCompleted && (
              <button onClick={markComplete} className="px-4 py-2 rounded bg-emerald-600 text-white">Mark as complete</button>
            )}

            {isCompleted && (
              <button onClick={unmarkComplete} aria-label="Mark as not completed" className="px-4 py-2 rounded bg-gray-200 text-gray-700">Completed</button>
            )}

            <button onClick={goNext} className="px-4 py-2 rounded bg-blue-600 text-white">Next</button>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="bg-white rounded shadow p-6">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white px-3 py-2 -mx-6 mt-0 mb-2 rounded-t-md">
              <h2 className="text-sm font-semibold text-indigo-700">Discussion</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {qnaLoading && <span>Loading…</span>}
                <span>{threadsMeta ? `${threadsMeta.totalRoots} posts` : `${roots.length} posts`}</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">Ask questions about this lesson and discuss with peers and your instructor.</p>

            {/* Composer */}
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                  {appUser ? (appUser.username ? appUser.username.charAt(0).toUpperCase() : (appUser.email ? appUser.email.charAt(0).toUpperCase() : 'U')) : 'U'}
                </div>
                <div className="flex-1">
                  <input
                    className="w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
                    placeholder={appUser ? 'Ask a question…' : 'Sign in to ask a question'}
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    disabled={!appUser}
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={postQuestion}
                      disabled={!appUser || !newQuestion.trim()}
                      className={`px-2 py-1 rounded text-xs ${(!appUser || !newQuestion.trim()) ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Threads */}
            <div className="mt-6">
              {roots.length === 0 && (
                <div className="text-sm text-gray-500">No questions yet. Be the first to ask!</div>
              )}

              <ul className="space-y-2">
                {roots.map((t) => {
                  const info = subtreeInfo[t._id] || { maxDepth: 0 };
                  const needsCollapse = info.maxDepth > VISIBLE_LEVELS && !expandedThreads[t._id];
                  const maxDepth = needsCollapse ? (VISIBLE_LEVELS - 1) : Infinity; // show levels 0..VISIBLE_LEVELS-1 when collapsed
                  return renderQnaNode(t, 0, t._id, maxDepth);
                })}
              </ul>

              {/* Pagination controls for thread pages */}
              {threadsMeta && threadsMeta.totalRoots > THREADS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setThreadPage(p => Math.max(1, p - 1))}
                    disabled={threadPage <= 1}
                    className={`px-3 py-1 rounded-md text-sm ${threadPage <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
                    Prev
                  </button>
                  <div className="text-sm text-gray-600">Page {threadsMeta.page} of {threadsMeta.totalPages}</div>
                  <button
                    onClick={() => setThreadPage(p => Math.min(threadsMeta.totalPages, p + 1))}
                    disabled={threadPage >= threadsMeta.totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${threadPage >= threadsMeta.totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Notification open={notificationOpen} message={notificationMsg} type={notificationType} onClose={() => setNotificationOpen(false)} duration={4000} />
    </div>
  );
}
