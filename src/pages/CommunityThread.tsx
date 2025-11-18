import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as communityApi from '../api/communityApi';
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';

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
      } catch (err) {
        console.error('Failed to load thread', err);
      } finally {
        if (mounted) setLoading(false);
      }
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
      const resp = await communityApi.getThread(id);
      setPosts(resp.posts || []);
      if (parentId) setReplyDrafts(prev => ({ ...prev, [parentId]: '' })); else setNewReply('');
    } catch (err) {
      console.error('Failed to post reply', err);
      alert('Failed to post reply');
    }
  };

  const updatePost = async (postId: string) => {
    const draft = (editDrafts[postId] || '').trim();
    if (!draft) return;
    try {
      await communityApi.updatePost(postId, draft);
      const resp = await communityApi.getThread(id!);
      setRoot(resp.root || null);
      setPosts(resp.posts || []);
      setEditDrafts(prev => { const { [postId]: _, ...rest } = prev; return rest; });
    } catch (err) {
      console.error('Failed to update post', err);
      alert('Failed to update post');
    }
  };

  const removePost = async (postId: string) => {
    if (!confirm('Delete this post? This will hide its content.')) return;
    try {
      await communityApi.deletePost(postId);
      const resp = await communityApi.getThread(id!);
      setRoot(resp.root || null);
      setPosts(resp.posts || []);
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Failed to delete post');
    }
  };

  const childrenById = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of posts) {
      const pid = p.parentId ? String(p.parentId) : '';
      if (pid) {
        if (!map[pid]) map[pid] = [];
        map[pid].push(p);
      }
    }
    return map;
  }, [posts]);

  // Compute subtree info for collapse/expand behavior
  const subtreeInfo = useMemo(() => {
    const info: Record<string, { maxDepth: number; totalDescendants: number }> = {};
    const dfs = (id: string) => {
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
    for (const p of posts) {
      if (!info[p._id]) dfs(p._id);
    }
    return info;
  }, [childrenById, posts]);

  const renderNode = (node: any, level = 0, rootId?: string, maxDepth: number = Infinity) => {
    const children = childrenById[node._id] || [];
    const authorObj = (typeof node.authorId === 'object' && node.authorId) ? node.authorId as any : null;
    const authorLabel = authorObj ? (authorObj.username || authorObj.email || 'User') : 'User';
    const isRoot = level === 0;
    const created = node.createdAt ? new Date(node.createdAt).toLocaleString() : '';
    const authorIdObj = node.authorId && (typeof node.authorId === 'object' ? node.authorId._id : node.authorId);
    const isAuthor = appUser && authorIdObj && String(authorIdObj) === String(appUser._id);
    const isEditing = editDrafts.hasOwnProperty(node._id);

    return (
      <li key={node._id} className={`${level === 0 ? '' : ''}`}>
        <div className={`flex items-start gap-2 p-2 rounded-md ${isRoot ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'bg-white'} ${isRoot ? 'border-l-4 border-indigo-200' : ''}`}>
          <div className="flex-shrink-0">
            {authorObj && authorObj.profile && authorObj.profile.picUrl ? (
              <img src={authorObj.profile.picUrl} alt={authorLabel} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">{(authorLabel || 'U').charAt(0)}</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium text-gray-800 text-sm">{authorLabel}</span>
                {isRoot && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-semibold">Question</span>
                )}
                {created && <span className="ml-2 text-xs text-gray-400">• {created}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isAuthor && !node.deleted && !isEditing && (
                  <button className="text-indigo-600 hover:underline" onClick={() => setEditDrafts(prev => ({ ...prev, [node._id]: node.content || '' }))}>Edit</button>
                )}
                {isEditing && (
                  <>
                    <button className="text-emerald-600 hover:underline" onClick={() => updatePost(node._id)}>Save</button>
                    <button className="text-gray-600 hover:underline" onClick={() => setEditDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; })}>Cancel</button>
                  </>
                )}
                {isAuthor && !node.deleted && (
                  <button className="text-rose-600 hover:underline" onClick={() => removePost(node._id)}>Delete</button>
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
              {!replyDrafts[node._id] ? (
                <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                  if (!appUser) { alert('Sign in to reply'); return; }
                  setReplyDrafts(prev => ({ ...prev, [node._id]: '' }));
                }}>Reply</button>
              ) : (
                <div className="w-full">
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder={'Write a reply…'} value={replyDrafts[node._id] || ''} onChange={(e) => setReplyDrafts(prev => ({ ...prev, [node._id]: e.target.value }))} />
                  <div className="mt-1 flex justify-end gap-2">
                    <button onClick={() => submitReply(node._id)} disabled={!(replyDrafts[node._id] || '').trim()} className={`px-2 py-1 rounded text-xs ${!(replyDrafts[node._id] || '').trim() ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Post</button>
                    <button onClick={() => setReplyDrafts(prev => { const { [node._id]: _, ...rest } = prev; return rest; })} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
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
                {children.map(child => renderNode(child, level + 1, rootId, maxDepth))}
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

  if (loading) return <main className="pt-6 p-6 max-w-4xl mx-auto">Loading…</main>;
  if (!root) return <main className="pt-6 p-6 max-w-4xl mx-auto">Thread not found.</main>;

  return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="inline-flex items-center px-3 py-2 mb-4 rounded bg-gray-100 hover:bg-gray-200 text-sm"
      >
        <span className="mr-2">←</span> Back
      </button>
      <div className="bg-white rounded shadow p-6">
        <h1 className="text-xl font-semibold">{root.title || 'Discussion'}</h1>
        <div className="mt-4">
          <ul>
            {renderNode(root, 0)}
            {posts.filter(p => String(p._id) !== String(root._id) && (!p.parentId || String(p.parentId) === String(root._id))).map(p => renderNode(p, 1))}
          </ul>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold">Add a reply</h2>
          <textarea className="w-full border rounded px-2 py-1 mt-2" rows={3} value={newReply} onChange={(e) => setNewReply(e.target.value)} />
          <div className="mt-2 flex justify-end">
            <button onClick={() => submitReply()} className="px-4 py-2 bg-indigo-600 text-white rounded">Post Reply</button>
          </div>
        </div>
      </div>
    </main>
  );
}
