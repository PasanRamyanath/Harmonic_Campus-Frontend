import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as communityApi from '../api/communityApi';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityThread() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [root, setRoot] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [newReply, setNewReply] = useState('');
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const VISIBLE_LEVELS = 2;

  const reload = async () => {
    if (!id) return;
    const resp = await communityApi.getThread(id);
    setRoot(resp.root || null);
    setPosts(resp.posts || []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const resp = await communityApi.getThread(id);
        if (!mounted) return;
        setRoot(resp.root || null);
        setPosts(resp.posts || []);
      } catch (err) { console.error('Failed to load thread', err); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  const submitReply = async (parentId?: string) => {
    if (!id) return;
    if (!appUser) { alert('Sign in to reply'); return; }
    const content = parentId ? (replyDrafts[parentId] || '').trim() : newReply.trim();
    if (!content) return;
    try {
      await communityApi.postReply(id, content, parentId);
      await reload();
      if (parentId) setReplyDrafts(prev => ({ ...prev, [parentId]: '' }));
      else setNewReply('');
    } catch { alert('Failed to post reply'); }
  };

  const updatePost = async (postId: string) => {
    const draft = (editDrafts[postId] || '').trim();
    if (!draft || !id) return;
    try {
      await communityApi.updatePost(postId, draft);
      await reload();
      setEditDrafts(prev => { const { [postId]: _, ...rest } = prev; return rest; });
    } catch { alert('Failed to update post'); }
  };

  const removePost = async (postId: string) => {
    if (!confirm('Delete this post?') || !id) return;
    try {
      await communityApi.deletePost(postId);
      await reload();
    } catch { alert('Failed to delete post'); }
  };

  const childrenById = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of posts) {
      const pid = p.parentId ? String(p.parentId) : '';
      if (pid) { if (!map[pid]) map[pid] = []; map[pid].push(p); }
    }
    return map;
  }, [posts]);

  const subtreeInfo = useMemo(() => {
    const info: Record<string, { maxDepth: number; totalDescendants: number }> = {};
    const dfs = (nodeId: string) => {
      const children = childrenById[nodeId] || [];
      let max = 0; let count = 0;
      for (const c of children) { const r = dfs(c._id); count += 1 + r.totalDescendants; max = Math.max(max, 1 + r.maxDepth); }
      info[nodeId] = { maxDepth: max, totalDescendants: count };
      return info[nodeId];
    };
    for (const p of posts) { if (!info[p._id]) dfs(p._id); }
    return info;
  }, [childrenById, posts]);

  const renderNode = (node: any, level = 0, rootId?: string, maxDepth: number = Infinity): React.ReactNode => {
    const children = childrenById[node._id] || [];
    const authorObj = typeof node.authorId === 'object' && node.authorId ? node.authorId as any : null;
    const authorLabel = authorObj ? (authorObj.username || authorObj.email || 'User') : 'User';
    const isRoot = level === 0;
    const created = node.createdAt ? new Date(node.createdAt).toLocaleString() : '';
    const authorIdObj = node.authorId && (typeof node.authorId === 'object' ? node.authorId._id : node.authorId);
    const isAuthor = appUser && authorIdObj && String(authorIdObj) === String(appUser._id);
    const isEditing = editDrafts.hasOwnProperty(node._id);

    return (
      <li key={node._id} className="list-none">
        <div className={`p-4 rounded-xl transition-all ${isRoot ? 'bg-purple-600/10 border border-purple-500/20' : 'bg-white/3 border border-white/5'}`}>
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {authorObj?.profile?.picUrl ? (
              <img src={authorObj.profile.picUrl} alt={authorLabel} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {(authorLabel || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{authorLabel}</span>
                  {isRoot && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold">
                      Original Post
                    </span>
                  )}
                  {created && <span className="text-slate-600 text-xs">{created}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {isAuthor && !node.deleted && !isEditing && (
                    <button
                      className="text-xs text-slate-500 hover:text-purple-400 transition-colors"
                      onClick={() => setEditDrafts(prev => ({ ...prev, [node._id]: node.content || '' }))}
                    >Edit</button>
                  )}
                  {isEditing && (
                    <>
                      <button className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors" onClick={() => updatePost(node._id)}>Save</button>
                      <button className="text-xs text-slate-500 hover:text-white transition-colors" onClick={() => setEditDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; })}>Cancel</button>
                    </>
                  )}
                  {isAuthor && !node.deleted && (
                    <button className="text-xs text-red-400/60 hover:text-red-400 transition-colors" onClick={() => removePost(node._id)}>Delete</button>
                  )}
                </div>
              </div>

              {/* Content */}
              {isEditing ? (
                <textarea
                  className="input-dark resize-none text-sm w-full"
                  rows={2}
                  value={editDrafts[node._id] || ''}
                  onChange={e => setEditDrafts(prev => ({ ...prev, [node._id]: e.target.value }))}
                />
              ) : (
                <div>
                  {node.deleted ? (
                    <span className="italic text-slate-600 text-sm">[deleted]</span>
                  ) : (
                    <>
                      <div
                        className="text-slate-300 text-sm leading-relaxed"
                        style={(!showMore[node._id] && node.content && (node.content.length > 150 || (node.content.match(/\n/g) || []).length > 1)) ? {
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        } as any : {}}
                      >
                        {node.content}
                      </div>
                      {node.content && (node.content.length > 150 || (node.content.match(/\n/g) || []).length > 1) && (
                        <button
                          className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors"
                          onClick={() => setShowMore(prev => ({ ...prev, [node._id]: !prev[node._id] }))}
                        >
                          {showMore[node._id] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Reply */}
              <div className="mt-3">
                {!replyDrafts.hasOwnProperty(node._id) ? (
                  <button
                    className="text-xs text-slate-500 hover:text-purple-400 transition-colors"
                    onClick={() => {
                      if (!appUser) { alert('Sign in to reply'); return; }
                      setReplyDrafts(prev => ({ ...prev, [node._id]: '' }));
                    }}
                  >
                    ↩ Reply
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      className="input-dark text-sm !py-2"
                      placeholder="Write a reply…"
                      value={replyDrafts[node._id] || ''}
                      onChange={e => setReplyDrafts(prev => ({ ...prev, [node._id]: e.target.value }))}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => submitReply(node._id)}
                        disabled={!(replyDrafts[node._id] || '').trim()}
                        className="btn-primary text-xs !py-1.5 !px-4 disabled:opacity-50"
                      >Post</button>
                      <button
                        onClick={() => setReplyDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; })}
                        className="btn-ghost text-xs !py-1.5 !px-3"
                      >Cancel</button>
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
                {children.map(child => renderNode(child, level + 1, rootId, maxDepth))}
              </ul>
            ) : (() => {
              const nodeInfo = subtreeInfo[node._id] || { totalDescendants: 0 };
              return nodeInfo.totalDescendants > 0 && rootId ? (
                <div className="mt-2 pl-4 ml-4">
                  <button
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    onClick={() => setExpandedThreads(prev => ({ ...prev, [rootId]: true }))}
                  >
                    Show {nodeInfo.totalDescendants} more repl{nodeInfo.totalDescendants > 1 ? 'ies' : 'y'}
                  </button>
                </div>
              ) : null;
            })()}
            {rootId && expandedThreads[rootId] && level === (VISIBLE_LEVELS - 1) && (() => {
              const nodeInfo = subtreeInfo[node._id] || { totalDescendants: 0 };
              return nodeInfo.totalDescendants > 0 ? (
                <div className="mt-1 pl-4 ml-4">
                  <button
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setExpandedThreads(prev => ({ ...prev, [rootId]: false }))}
                  >
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
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    </main>
  );

  if (!root) return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4 flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <p className="text-slate-400">Thread not found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm mt-4 inline-block">Go Back</button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Community
        </button>

        <div className="glass-card p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-6">{root.title || 'Discussion'}</h1>
          <ul className="space-y-3">
            {renderNode(root, 0)}
            {posts
              .filter(p => String(p._id) !== String(root._id) && (!p.parentId || String(p.parentId) === String(root._id)))
              .map(p => renderNode(p, 1))}
          </ul>

          {/* Reply composer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h2 className="text-white font-semibold mb-3">Add a Reply</h2>
            <textarea
              className="input-dark resize-none mb-3"
              rows={4}
              placeholder={appUser ? 'Write your reply…' : 'Sign in to reply'}
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              disabled={!appUser}
            />
            <div className="flex justify-end">
              <button
                onClick={() => submitReply()}
                disabled={!appUser || !newReply.trim()}
                className="btn-primary text-sm !py-2.5 !px-6 disabled:opacity-50"
              >
                Post Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
