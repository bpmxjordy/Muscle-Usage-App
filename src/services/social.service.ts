import { supabase } from '../lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────
export interface FeedItemWithDetails {
    id: string
    user_id: string
    type: 'workout' | 'pr' | 'routine'
    title: string
    description: string | null
    created_at: string
    profile: { id: string; username: string; display_name: string; avatar_url: string | null }
    likes_count: number
    comments_count: number
    is_liked: boolean
}

export interface Comment {
    id: string
    content: string
    created_at: string
    profile: { id: string; username: string; display_name: string; avatar_url: string | null }
}

// ─── Feed ───────────────────────────────────────────────────────────
export async function getFeed(userId: string): Promise<FeedItemWithDetails[]> {
    // Get feed items from followed users + own
    const { data, error } = await supabase
        .from('feed_items')
        .select(`
      *,
      profile:profiles!feed_items_user_id_fkey (id, username, display_name, avatar_url),
      feed_likes (user_id),
      feed_comments (id)
    `)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) throw error

    return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        type: item.type,
        title: item.title,
        description: item.description,
        created_at: item.created_at,
        profile: item.profile,
        likes_count: item.feed_likes?.length || 0,
        comments_count: item.feed_comments?.length || 0,
        is_liked: item.feed_likes?.some((l: any) => l.user_id === userId) || false,
    }))
}

// ─── Post a feed item ───────────────────────────────────────────────
export async function postFeedItem(
    userId: string,
    item: { type: 'workout' | 'pr' | 'routine' | 'post'; title: string; description?: string; workout_id?: string; pr_id?: string; routine_id?: string }
) {
    const { error } = await supabase.from('feed_items').insert({
        user_id: userId,
        type: item.type,
        title: item.title,
        description: item.description || null,
        workout_id: item.workout_id || null,
        pr_id: item.pr_id || null,
        routine_id: item.routine_id || null,
    })
    if (error) throw error
}

// ─── Likes ──────────────────────────────────────────────────────────
export async function toggleLike(feedItemId: string, userId: string) {
    const { data: existing } = await supabase
        .from('feed_likes')
        .select('id')
        .eq('feed_item_id', feedItemId)
        .eq('user_id', userId)
        .single()

    if (existing) {
        await supabase.from('feed_likes').delete().eq('id', existing.id)
        return false
    } else {
        await supabase.from('feed_likes').insert({ feed_item_id: feedItemId, user_id: userId })
        return true
    }
}

// ─── Comments ───────────────────────────────────────────────────────
export async function getComments(feedItemId: string): Promise<Comment[]> {
    const { data, error } = await supabase
        .from('feed_comments')
        .select(`*, profile:profiles!feed_comments_user_id_fkey (id, username, display_name, avatar_url)`)
        .eq('feed_item_id', feedItemId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        profile: c.profile,
    }))
}

export async function addComment(feedItemId: string, userId: string, content: string) {
    const { error } = await supabase
        .from('feed_comments')
        .insert({ feed_item_id: feedItemId, user_id: userId, content })
    if (error) throw error
}

// ─── Follows ────────────────────────────────────────────────────────
export async function getFollowing(userId: string) {
    const { data, error } = await supabase
        .from('follows')
        .select('following_id, profile:profiles!follows_following_id_fkey (id, username, display_name, avatar_url)')
        .eq('follower_id', userId)

    if (error) throw error
    return (data || []).map((f: any) => f.profile)
}

export async function getFollowers(userId: string) {
    const { data, error } = await supabase
        .from('follows')
        .select('follower_id, profile:profiles!follows_follower_id_fkey (id, username, display_name, avatar_url)')
        .eq('following_id', userId)

    if (error) throw error
    return (data || []).map((f: any) => f.profile)
}

export async function followUser(followerId: string, followingId: string) {
    const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId })
    if (error) throw error
}

export async function unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
    if (error) throw error
}

// ─── Suggested Users ────────────────────────────────────────────────
export async function getSuggestedUsers(userId: string) {
    // Get users NOT followed by user
    const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

    const followingIds = (following || []).map((f) => f.following_id)
    followingIds.push(userId) // exclude self

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .not('id', 'in', `(${followingIds.join(',')})`)
        .limit(10)

    if (error) throw error
    return data || []
}
