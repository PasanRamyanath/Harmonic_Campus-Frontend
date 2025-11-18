import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as communityApi from '../api/communityApi';
import { useAuth } from '../contexts/AuthContext';

export default function Community() {
  const { appUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ totalRoots: number; page: number; limit: number; totalPages: number } | null>(null);
  const [query, setQuery] = useState<string>(searchParams.get('q') || '');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await communityApi.listThreads(query, page, 10);
        if (!mounted) return;
        setThreads(resp.items || []);
        setMeta(resp.meta || null);
      } catch (err) {
        console.error('Failed to load community threads', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [query, page]);

  useEffect(() => {
    const p: any = {};
    if (query) p.q = query;
    if (page && page !== 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [query, page]);

  const submitThread = async () => {
    if (!appUser) { alert('Please sign in to post.'); return; }
    if (!newContent.trim()) return;
    try {
      await communityApi.createThread(newContent.trim(), newTitle.trim() || undefined);
      setNewTitle('');
      setNewContent('');
      setPage(1);
      const resp = await communityApi.listThreads(query, 1, 10);
      setThreads(resp.items || []);
      setMeta(resp.meta || null);
    } catch (err) {
      console.error('Failed to create thread', err);
      alert('Failed to create thread');
    }
  };

  const removeThread = async (threadId: string) => {
    if (!confirm('Delete this thread? This will hide its content.')) return;
    try {
      await communityApi.deletePost(threadId);
      const resp = await communityApi.listThreads(query, page, 10);
      setThreads(resp.items || []);
      setMeta(resp.meta || null);
    } catch (err) {
      console.error('Failed to delete thread', err);
      alert('Failed to delete thread');
    }
  };

  return (
    <main className="pt-6 p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-semibold text-indigo-700">Community Support</h1>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threads..."
              className="border rounded px-3 py-2 text-sm w-64"
            />
          </div>
        </div>

        {/* New thread composer */}
        <div className="mt-5 border-t pt-4">
          <div className="text-sm text-gray-600 mb-2">Start a new discussion</div>
          <input
            className="w-full border rounded px-3 py-2 text-sm mb-2"
            placeholder="Optional title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={!appUser}
          />
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder={appUser ? 'Describe your question...' : 'Sign in to post'}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            disabled={!appUser}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submitThread}
              disabled={!appUser || !newContent.trim()}
              className={`px-4 py-2 rounded ${(!appUser || !newContent.trim()) ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              Post
            </button>
          </div>
        </div>

        {/* Threads list */}
        <div className="mt-6">
          {loading ? (
            <div>Loading…</div>
          ) : (
            <ul className="divide-y">
              {threads.map(t => {
                const authorIdObj = t.authorId && (typeof t.authorId === 'object' ? t.authorId._id : t.authorId);
                const isAuthor = appUser && authorIdObj && String(authorIdObj) === String(appUser._id);
                return (
                <li key={t._id} className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Link to={`/community/${t._id}`} className="block">
                        <div className="text-base font-medium text-gray-900">{t.title || (t.content?.slice(0, 80) || 'Untitled')}</div>
                        <div className="text-sm text-gray-700 line-clamp-2">{t.content}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {t.repliesCount} repl{t.repliesCount === 1 ? 'y' : 'ies'} • {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}
                        </div>
                      </Link>
                    </div>
                    {isAuthor && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeThread(t._id)} className="text-rose-600 text-sm">Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              )})}
              {threads.length === 0 && (
                <li className="py-6 text-sm text-gray-500">No threads found.</li>
              )}
            </ul>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-3 py-1 rounded ${page <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
              >Prev</button>
              <div className="text-sm text-gray-600">Page {meta.page} of {meta.totalPages}</div>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className={`px-3 py-1 rounded ${page >= meta.totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
              >Next</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
