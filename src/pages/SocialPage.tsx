import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
    Users,
    Heart,
    MessageCircle,
    Dumbbell,
    Award,
    TrendingUp,
    Search,
    Send,
    UserPlus,
    Loader2,
    RefreshCw,
    PenSquare,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    getFeed,
    toggleLike,
    getComments,
    addComment,
    getFollowing,
    followUser,
    unfollowUser,
    getSuggestedUsers,
    postFeedItem,
} from '../services/social.service'
import type { FeedItemWithDetails, Comment } from '../services/social.service'

// ─── Helpers ────────────────────────────────────────────────────────
function getTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function getTypeIcon(type: FeedItemWithDetails['type']) {
    switch (type) {
        case 'workout': return Dumbbell
        case 'pr': return Award
        case 'routine': return TrendingUp
        default: return MessageCircle // For 'post' type
    }
}

function getTypeBg(type: FeedItemWithDetails['type']) {
    switch (type) {
        case 'workout': return 'bg-primary/15 text-primary-light'
        case 'pr': return 'bg-accent/15 text-accent'
        case 'routine': return 'bg-secondary/15 text-secondary-light'
        default: return 'bg-surface-light text-text-muted'
    }
}

// ─── Comment Panel ──────────────────────────────────────────────────
function CommentPanel({
    feedItemId,
    userId,

}: {
    feedItemId: string
    userId: string
    onClose: () => void
}) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        loadComments()
    }, [feedItemId])

    const loadComments = async () => {
        setLoading(true)
        try {
            const data = await getComments(feedItemId)
            setComments(data)
        } catch {
            // silently fail
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async () => {
        if (!newComment.trim() || sending) return
        setSending(true)
        try {
            await addComment(feedItemId, userId, newComment.trim())
            setNewComment('')
            await loadComments()
        } catch {
            // silently fail
        } finally {
            setSending(false)
        }
    }

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
        >
            <div className="pt-3 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-2">No comments yet. Be the first!</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {comments.map((c) => (
                            <div key={c.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                    {c.profile.display_name[0]}
                                </div>
                                <div>
                                    <p className="text-xs">
                                        <span className="font-medium">{c.profile.display_name}</span>{' '}
                                        <span className="text-text-muted">{c.content}</span>
                                    </p>
                                    <p className="text-[10px] text-text-muted">{getTimeAgo(c.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-surface-light border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !newComment.trim()}
                        className="p-2 rounded-xl bg-primary text-white hover:brightness-110 transition disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────
export default function SocialPage() {
    const { user } = useAuthStore()
    const userId = user?.id || ''

    const [feed, setFeed] = useState<FeedItemWithDetails[]>([])
    const [following, setFollowing] = useState<{ id: string; username: string; display_name: string; avatar_url: string | null }[]>([])
    const [suggested, setSuggested] = useState<{ id: string; username: string; display_name: string; avatar_url: string | null }[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [postContent, setPostContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [openComments, setOpenComments] = useState<string | null>(null)
    const [loadingFeed, setLoadingFeed] = useState(true)
    const [loadingSocial, setLoadingSocial] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadFeed = useCallback(async () => {
        if (!userId) return
        try {
            const data = await getFeed(userId)
            setFeed(data)
        } catch {
            // silently fail
        } finally {
            setLoadingFeed(false)
            setRefreshing(false)
        }
    }, [userId])

    const loadSocial = useCallback(async () => {
        if (!userId) return
        try {
            const [followingData, suggestedData] = await Promise.all([
                getFollowing(userId),
                getSuggestedUsers(userId),
            ])
            setFollowing(followingData)
            setSuggested(suggestedData)
        } catch {
            // silently fail
        } finally {
            setLoadingSocial(false)
        }
    }, [userId])

    useEffect(() => {
        loadFeed()
        loadSocial()
    }, [loadFeed, loadSocial])

    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.all([loadFeed(), loadSocial()])
    }

    const handleCreatePost = async () => {
        if (!userId || !postContent.trim()) return
        setIsPosting(true)
        try {
            await postFeedItem(userId, {
                type: 'post',
                title: user?.display_name || 'User check-in',
                description: postContent.trim(),
            })
            setPostContent('')
            await loadFeed()
        } catch {
            // silently fail
        } finally {
            setIsPosting(false)
        }
    }

    const handleToggleLike = async (itemId: string) => {
        if (!userId) return
        // Optimistic update
        setFeed((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        is_liked: !item.is_liked,
                        likes_count: item.is_liked ? item.likes_count - 1 : item.likes_count + 1,
                    }
                    : item
            )
        )
        try {
            await toggleLike(itemId, userId)
        } catch {
            // Revert on failure
            await loadFeed()
        }
    }

    const handleFollow = async (targetId: string) => {
        if (!userId) return
        try {
            await followUser(userId, targetId)
            await loadSocial()
        } catch {
            // silently fail
        }
    }

    const handleUnfollow = async (targetId: string) => {
        if (!userId) return
        try {
            await unfollowUser(userId, targetId)
            await loadSocial()
        } catch {
            // silently fail
        }
    }

    const filteredFollowing = following.filter(
        (f) =>
            f.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Social Feed</h1>
                    <p className="text-text-muted">See what your gym community is up to</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2.5 rounded-xl bg-surface border border-border hover:bg-surface-light transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 text-text-muted ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Create Post */}
            <div className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user?.display_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Share your progress, throw out a challenge, or just say hi..."
                            className="w-full bg-transparent border-0 resize-none focus:ring-0 p-0 text-sm h-20 placeholder:text-text-muted"
                        />
                        <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                            <span className="text-xs text-text-muted">
                                {postContent.length}/280
                            </span>
                            <button
                                onClick={handleCreatePost}
                                disabled={!postContent.trim() || isPosting}
                                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenSquare className="w-3 h-3" />}
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Following Bar */}
            <div className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-light" /> Following
                        <span className="text-xs text-text-muted font-normal">({following.length})</span>
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter..."
                            className="pl-8 pr-3 py-1.5 bg-surface-light border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition w-36"
                        />
                    </div>
                </div>

                {loadingSocial ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                    </div>
                ) : filteredFollowing.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-3">
                        {searchTerm ? 'No matches' : 'Not following anyone yet. Discover people below!'}
                    </p>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {filteredFollowing.map((person) => (
                            <div key={person.id} className="flex flex-col items-center gap-1.5 min-w-[72px]">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                                        {person.display_name[0]}
                                    </div>
                                    <button
                                        onClick={() => handleUnfollow(person.id)}
                                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center text-white text-xs hover:bg-danger transition"
                                        title="Unfollow"
                                    >
                                        ✓
                                    </button>
                                </div>
                                <p className="text-xs text-text-muted truncate w-full text-center">
                                    {person.display_name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Suggested Users */}
            {suggested.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-4">
                    <h2 className="font-bold flex items-center gap-2 mb-3">
                        <UserPlus className="w-4 h-4 text-secondary" /> Discover People
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {suggested.map((person) => (
                            <div key={person.id} className="flex flex-col items-center gap-1.5 min-w-[72px]">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-sm">
                                        {person.display_name[0]}
                                    </div>
                                    <button
                                        onClick={() => handleFollow(person.id)}
                                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-lighter flex items-center justify-center text-white text-xs hover:bg-primary transition"
                                        title="Follow"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-xs text-text-muted truncate w-full text-center">
                                    {person.display_name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feed */}
            {loadingFeed ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : feed.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                    <Dumbbell className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
                    <p className="text-text-muted font-medium">No posts yet</p>
                    <p className="text-sm text-text-muted mt-1">
                        Follow people and complete workouts to see activity here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feed.map((item) => {
                        const Icon = getTypeIcon(item.type)
                        const typeBg = getTypeBg(item.type)

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/20 transition"
                            >
                                {/* User header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                                        {item.profile.display_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{item.profile.display_name}</p>
                                        <p className="text-xs text-text-muted">
                                            @{item.profile.username} • {getTimeAgo(item.created_at)}
                                        </p>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeBg}`}>
                                        <Icon className="w-3.5 h-3.5 inline mr-1" />
                                        {item.type.toUpperCase()}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="font-bold mb-1">{item.title}</h3>
                                {item.description && (
                                    <p className="text-sm text-text-muted mb-3">{item.description}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-3 border-t border-border">
                                    <button
                                        onClick={() => handleToggleLike(item.id)}
                                        className={`flex items-center gap-1.5 text-sm transition ${item.is_liked ? 'text-danger' : 'text-text-muted hover:text-danger'
                                            }`}
                                    >
                                        <Heart
                                            className="w-4 h-4"
                                            fill={item.is_liked ? 'currentColor' : 'none'}
                                        />
                                        {item.likes_count}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setOpenComments(openComments === item.id ? null : item.id)
                                        }
                                        className={`flex items-center gap-1.5 text-sm transition ${openComments === item.id
                                            ? 'text-primary-light'
                                            : 'text-text-muted hover:text-primary-light'
                                            }`}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        {item.comments_count}
                                    </button>
                                </div>

                                {/* Inline comments */}
                                <AnimatePresence>
                                    {openComments === item.id && (
                                        <CommentPanel
                                            feedItemId={item.id}
                                            userId={userId}
                                            onClose={() => setOpenComments(null)}
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
