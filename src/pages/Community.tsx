import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as communityApi from '../api/communityApi';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Community() {
  const { appUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ totalRoots: number; page: number; limit: number; totalPages: number } | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const loadThreads = async (q = query, p = page) => {
    setLoading(true);
    try {
      const resp = await communityApi.listThreads(q, p, 10);
      setThreads(resp.items || []);
      setMeta(resp.meta || null);
    } catch (err) { console.error('Failed to load community threads', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadThreads(); }, [query, page]);

  useEffect(() => {
    const p: any = {};
    if (query) p.q = query;
    if (page && page !== 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [query, page]);

  const submitThread = async () => {
    if (!appUser) { alert('Please sign in to post.'); return; }
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      await communityApi.createThread(newContent.trim(), newTitle.trim() || undefined);
      setNewTitle('');
      setNewContent('');
      setShowCompose(false);
      setPage(1);
      await loadThreads(query, 1);
    } catch { alert('Failed to create thread'); }
    finally { setPosting(false); }
  };

  const removeThread = async (threadId: string) => {
    if (!confirm('Delete this thread?')) return;
    try {
      await communityApi.deletePost(threadId);
      await loadThreads();
    } catch { alert('Failed to delete thread'); }
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Community' }]} />

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
            <p className="text-slate-400">Ask questions, share tips, and connect with fellow musicians</p>
          </div>
          {appUser && (
            <button onClick={() => setShowCompose(!showCompose)} className="btn-primary text-sm !py-2.5 !px-5">
              + New Discussion
            </button>
          )}
        </div>

        {/* Compose panel */}
        {showCompose && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Start a New Discussion</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Title (optional)</label>
                <input className="input-dark" placeholder="Brief title for your post" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Your Question / Post</label>
                <textarea className="input-dark resize-none" rows={4} placeholder="Describe your question or share your thoughts..." value={newContent} onChange={e => setNewContent(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCompose(false)} className="btn-ghost text-sm !py-2 !px-4">Cancel</button>
                <button onClick={submitThread} disabled={!newContent.trim() || posting} className="btn-primary text-sm !py-2 !px-5 disabled:opacity-50">
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="glass-card p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search discussions..."
              className="input-dark !pl-9"
            />
          </div>
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : threads.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">No discussions yet</p>
            <p className="text-slate-500 text-sm">Be the first to start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map(t => {
              const authorIdObj = t.authorId && (typeof t.authorId === 'object' ? t.authorId._id : t.authorId);
              const isAuthor = appUser && authorIdObj && String(authorIdObj) === String(appUser._id);
              return (
                <div key={t._id} className="glass-card-hover">
                  <Link to={`/community/${t._id}`} className="block p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600/30 to-cyan-500/20 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold leading-snug">
                          {t.title || (t.content?.slice(0, 80) || 'Untitled')}
                        </p>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{t.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-600">{t.repliesCount} repl{t.repliesCount === 1 ? 'y' : 'ies'}</span>
                          <span className="text-xs text-slate-700">·</span>
                          <span className="text-xs text-slate-600">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {isAuthor && (
                    <div className="px-5 pb-4 flex justify-end">
                      <button onClick={() => removeThread(t._id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost text-sm !py-2 !px-5 disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-slate-400 text-sm">Page {meta.page} of {meta.totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="btn-ghost text-sm !py-2 !px-5 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
