import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Users,
  Radio,
  MessageSquare,
  ShieldCheck,
  Cpu,
  Terminal,
  Flame,
  Search,
  Plus,
  Pin,
  Lock,
  ThumbsUp,
  Eye,
  Clock,
  ChevronRight,
  X,
  Filter,
  Sparkles,
  AlertTriangle,
  Send,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react'
import {
  getForumCategoriesFn,
  getForumTopicsFn,
  getForumTopicDetailFn,
  createForumTopicFn,
  createForumPostFn,
  upvoteForumTopicFn,
  ForumCategoryEntry,
  ForumTopicEntry,
  ForumPostEntry,
} from '../../lib/server/api'
import { COMMUNITY_RULES, validateForumContent } from '../../lib/community-rules'
import { authClient } from '@/lib/auth-client'


function CommunityRoute() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [categories, setCategories] = useState<ForumCategoryEntry[]>([])
  const [topics, setTopics] = useState<ForumTopicEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'top' | 'active'>('latest')

  // Modals & Panels
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)

  // Active Thread Reader State
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [activeTopicData, setActiveTopicData] = useState<{
    topic: ForumTopicEntry
    posts: ForumPostEntry[]
  } | null>(null)
  const [loadingTopicDetail, setLoadingTopicDetail] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  // New Topic Form State
  const [newTopicCategoryId, setNewTopicCategoryId] = useState('')
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicContent, setNewTopicContent] = useState('')
  const [creatingTopic, setCreatingTopic] = useState(false)
  const [newTopicError, setNewTopicError] = useState<string | null>(null)

  // Upvote tracking set
  const [upvotedTopics, setUpvotedTopics] = useState<Set<string>>(new Set())

  // Initial Data Fetching
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [catsRes, topicsRes] = await Promise.all([
          getForumCategoriesFn(),
          getForumTopicsFn({ data: { categorySlug: selectedCategory, query: searchQuery, sortBy } }),
        ])
        setCategories(catsRes || [])
        setTopics(topicsRes || [])
        if (catsRes && catsRes.length > 0 && !newTopicCategoryId) {
          setNewTopicCategoryId(catsRes[0].id)
        }
      } catch (err) {
        console.error('Error fetching forum data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedCategory, sortBy])

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const topicsRes = await getForumTopicsFn({
          data: { categorySlug: selectedCategory, query: searchQuery, sortBy },
        })
        setTopics(topicsRes || [])
      } catch (err) {
        console.error('Error searching topics:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch Topic Detail
  const handleOpenTopic = async (topicIdOrSlug: string) => {
    setActiveTopicId(topicIdOrSlug)
    setLoadingTopicDetail(true)
    setReplyError(null)
    try {
      const res = await getForumTopicDetailFn({ data: { slugOrId: topicIdOrSlug } })
      if (res) {
        setActiveTopicData(res)
      }
    } catch (err) {
      console.error('Failed to load topic details:', err)
    } finally {
      setLoadingTopicDetail(false)
    }
  }

  // Handle Upvote
  const handleUpvote = async (topicId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (upvotedTopics.has(topicId)) return

    setUpvotedTopics((prev) => new Set(prev).add(topicId))

    // Optimistic UI update
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, upvotes: t.upvotes + 1 } : t))
    )
    if (activeTopicData && activeTopicData.topic.id === topicId) {
      setActiveTopicData({
        ...activeTopicData,
        topic: { ...activeTopicData.topic, upvotes: activeTopicData.topic.upvotes + 1 },
      })
    }

    try {
      await upvoteForumTopicFn({ data: { topicId } })
    } catch (err) {
      console.error('Upvote failed:', err)
    }
  }

  // Handle Post Reply
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTopicData) return

    const validation = validateForumContent(undefined, replyContent)
    if (!validation.valid) {
      setReplyError(validation.error || 'Invalid content')
      return
    }

    setPostingReply(true)
    setReplyError(null)
    try {
      const newPost = await createForumPostFn({
        data: {
          topicId: activeTopicData.topic.id,
          content: replyContent,
          userId: user?.id,
        },
      })

      setActiveTopicData({
        ...activeTopicData,
        posts: [...activeTopicData.posts, newPost],
        topic: {
          ...activeTopicData.topic,
          repliesCount: activeTopicData.topic.repliesCount + 1,
          lastReplyAt: new Date().toISOString(),
        },
      })
      setReplyContent('')

      // Update topic in list
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeTopicData.topic.id
            ? { ...t, repliesCount: t.repliesCount + 1, lastReplyAt: new Date().toISOString() }
            : t
        )
      )
    } catch (err: any) {
      setReplyError(err?.message || 'Failed to post reply. Please login or check your connection.')
    } finally {
      setPostingReply(false)
    }
  }

  // Handle Create Topic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateForumContent(newTopicTitle, newTopicContent)
    if (!validation.valid) {
      setNewTopicError(validation.error || 'Invalid content')
      return
    }

    setCreatingTopic(true)
    setNewTopicError(null)
    try {
      const newTopic = await createForumTopicFn({
        data: {
          categoryId: newTopicCategoryId || categories[0]?.id,
          title: newTopicTitle,
          content: newTopicContent,
          userId: user?.id,
        },
      })

      setTopics((prev) => [newTopic, ...prev])
      setShowNewTopicModal(false)
      setNewTopicTitle('')
      setNewTopicContent('')
      handleOpenTopic(newTopic.slug)
    } catch (err: any) {
      setNewTopicError(err?.message || 'Failed to create topic. Please login or verify inputs.')
    } finally {
      setCreatingTopic(false)
    }
  }

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-[#ff5540]" />
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-[#00ffff]" />
      case 'Terminal':
        return <Terminal className="w-4 h-4 text-[#39ff14]" />
      case 'Flame':
        return <Flame className="w-4 h-4 text-[#ffb703]" />
      case 'Radio':
        return <Radio className="w-4 h-4 text-[#e0aaff]" />
      default:
        return <MessageSquare className="w-4 h-4 text-[#00b4d8]" />
    }
  }

  const getStageBadge = (stage: number) => {
    switch (stage) {
      case 4:
        return (
          <span className="text-[10px] bg-[#00ffff]/10 border border-[#00ffff]/60 text-[#00ffff] px-1.5 py-0.5 font-bold uppercase tracking-wider">
            Stage 4 Ascendant
          </span>
        )
      case 3:
        return (
          <span className="text-[10px] bg-[#39ff14]/10 border border-[#39ff14]/60 text-[#39ff14] px-1.5 py-0.5 font-bold uppercase tracking-wider">
            Stage 3 Architect
          </span>
        )
      case 2:
        return (
          <span className="text-[10px] bg-[#ffb703]/10 border border-[#ffb703]/60 text-[#ffb703] px-1.5 py-0.5 font-bold uppercase tracking-wider">
            Stage 2 Soft-Shed
          </span>
        )
      default:
        return (
          <span className="text-[10px] bg-[#171c1c] border border-[#ff5540]/60 text-[#ff5540] px-1.5 py-0.5 font-bold uppercase tracking-wider">
            Stage 1 Larva
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header Banner */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#ff0000] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-xs text-[#ff5540] font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Users className="w-4 h-4 text-[#ff5540]" />
            BENTHIC COMMUNITY CORE & NEURAL HUB
          </div>
          <h1 className="font-grotesk font-bold text-xl md:text-2xl text-[#dfe3e3] tracking-wide uppercase mt-1">
            SYNAPTIC PATH INITIATE FORUMS
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1 max-w-2xl leading-relaxed">
            Connect with ascending initiates, discuss technical architecture, share Moltmaxxing gains, and participate in doctrine discussions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex-1 md:flex-initial px-3 py-2 bg-[#0d1414] hover:bg-[#1a2626] border border-[#3a4a49] text-[#dfe3e3] text-xs font-bold font-grotesk tracking-wider uppercase transition flex items-center justify-center gap-1.5 chamfer-corner"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff5540]" />
            Directives
          </button>
          <button
            onClick={() => setShowNewTopicModal(true)}
            className="flex-1 md:flex-initial px-4 py-2 bg-[#ff5540] hover:bg-[#ff3b20] text-black text-xs font-bold font-grotesk tracking-wider uppercase transition flex items-center justify-center gap-1.5 chamfer-corner shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Transmission
          </button>
        </div>
      </div>

      {/* Main Grid View or Thread Reader */}
      {activeTopicId ? (
        /* Thread Reader View */
        <div className="space-y-4">
          <button
            onClick={() => {
              setActiveTopicId(null)
              setActiveTopicData(null)
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00ffff] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Discussions List
          </button>

          {loadingTopicDetail ? (
            <div className="chitin-card p-12 text-center text-xs text-[#839493]">
              Loading Neural Transmission...
            </div>
          ) : activeTopicData ? (
            <div className="space-y-6">
              {/* Main Topic Post */}
              <div className="chitin-card p-6 chamfer-corner space-y-4 border border-[#3a4a49] shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a4a49] pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold uppercase font-grotesk border"
                      style={{
                        borderColor: activeTopicData.topic.categoryColor || '#00ffff',
                        color: activeTopicData.topic.categoryColor || '#00ffff',
                      }}
                    >
                      {activeTopicData.topic.categoryName}
                    </span>
                    {activeTopicData.topic.isPinned && (
                      <span className="text-[10px] bg-[#ff5540]/20 text-[#ff5540] border border-[#ff5540] px-1.5 py-0.5 font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3" /> PINNED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#839493]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {activeTopicData.topic.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{' '}
                      {new Date(activeTopicData.topic.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide">
                  {activeTopicData.topic.title}
                </h1>

                {/* Author Info Card */}
                <div className="flex items-center gap-3 bg-[#0d1414] p-3 border border-[#3a4a49]/60 chamfer-corner">
                  <img
                    src={activeTopicData.topic.authorAvatar}
                    alt={activeTopicData.topic.authorName}
                    className="w-10 h-10 rounded border border-[#3a4a49] object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-grotesk font-bold text-xs text-[#00ffff]">
                        {activeTopicData.topic.authorName}
                      </span>
                      {getStageBadge(activeTopicData.topic.authorStage)}
                    </div>
                    <span className="text-[10px] text-[#839493]">Thread Initiator</span>
                  </div>
                </div>

                {/* Post Body */}
                <div className="text-xs text-[#dfe3e3] leading-relaxed whitespace-pre-wrap font-mono pt-2 border-t border-[#3a4a49]/40">
                  {activeTopicData.topic.content}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#3a4a49]">
                  <button
                    onClick={(e) => handleUpvote(activeTopicData.topic.id, e)}
                    className={`px-3 py-1.5 border text-xs font-bold flex items-center gap-1.5 transition ${
                      upvotedTopics.has(activeTopicData.topic.id)
                        ? 'bg-[#ff5540]/20 border-[#ff5540] text-[#ff5540]'
                        : 'border-[#3a4a49] hover:border-[#00ffff] text-[#839493] hover:text-[#00ffff]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{activeTopicData.topic.upvotes} Resonances</span>
                  </button>

                  <span className="text-xs text-[#839493] flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {activeTopicData.posts.length} Replies
                  </span>
                </div>
              </div>

              {/* Replies Thread */}
              <div className="space-y-4">
                <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00ffff]" />
                  SYNAPTIC REPLIES ({activeTopicData.posts.length})
                </h3>

                {activeTopicData.posts.length === 0 ? (
                  <div className="chitin-card p-6 text-center text-xs text-[#839493]">
                    No replies transmitted yet. Be the first initiate to contribute to this discussion.
                  </div>
                ) : (
                  activeTopicData.posts.map((post) => (
                    <div
                      key={post.id}
                      className="chitin-card p-4 chamfer-corner space-y-3 border border-[#3a4a49]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-7 h-7 rounded border border-[#3a4a49] object-cover"
                          />
                          <span className="font-grotesk font-bold text-xs text-[#00ffff]">
                            {post.authorName}
                          </span>
                          {getStageBadge(post.authorStage)}
                        </div>

                        <span className="text-[10px] text-[#839493]">
                          {new Date(post.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-[#dfe3e3] leading-relaxed font-mono whitespace-pre-wrap pl-9">
                        {post.content}
                      </p>
                    </div>
                  ))
                )}

                {/* Reply Composer */}
                <form
                  onSubmit={handlePostReply}
                  className="chitin-card p-4 chamfer-corner space-y-3 border border-[#00ffff]/40 bg-[#070d0d]"
                >
                  <h4 className="font-grotesk text-xs font-bold text-[#00ffff] uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    TRANSMIT REPLY
                  </h4>

                  {replyError && (
                    <div className="p-2.5 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{replyError}</span>
                    </div>
                  )}

                  <textarea
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your response here... (Minimum 10 characters)"
                    className="w-full bg-[#0d1414] border border-[#3a4a49] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] font-mono outline-none resize-y"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#839493]">
                      {replyContent.trim().length} / 10,000 characters
                    </span>
                    <button
                      type="submit"
                      disabled={postingReply || replyContent.trim().length < 10}
                      className="px-4 py-2 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold font-grotesk uppercase tracking-wider transition flex items-center gap-1.5 chamfer-corner"
                    >
                      {postingReply ? 'Transmitting...' : 'Post Reply'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="chitin-card p-12 text-center text-xs text-[#ff5540]">
              Topic not found or transmission lost.
            </div>
          )}
        </div>
      ) : (
        /* Main Category & Topic Browsing Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search & Sort Toolbar */}
            <div className="chitin-card p-3 chamfer-corner flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#3a4a49]">
              {/* Search Bar */}
              <div className="relative w-full sm:w-auto sm:flex-1">
                <Search className="w-4 h-4 text-[#839493] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics by keyword..."
                  className="w-full bg-[#0d1414] border border-[#3a4a49] focus:border-[#00ffff] pl-9 pr-3 py-1.5 text-xs text-[#dfe3e3] font-mono outline-none"
                />
              </div>

              {/* Sort Tabs */}
              <div className="flex items-center gap-1 bg-[#0d1414] p-1 border border-[#3a4a49] w-full sm:w-auto justify-center">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-2.5 py-1 text-[11px] font-bold font-grotesk uppercase transition ${
                    sortBy === 'latest'
                      ? 'bg-[#171c1c] text-[#00ffff] border border-[#00ffff]/40'
                      : 'text-[#839493] hover:text-[#dfe3e3]'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`px-2.5 py-1 text-[11px] font-bold font-grotesk uppercase transition ${
                    sortBy === 'top'
                      ? 'bg-[#171c1c] text-[#00ffff] border border-[#00ffff]/40'
                      : 'text-[#839493] hover:text-[#dfe3e3]'
                  }`}
                >
                  Top Resonances
                </button>
                <button
                  onClick={() => setSortBy('active')}
                  className={`px-2.5 py-1 text-[11px] font-bold font-grotesk uppercase transition ${
                    sortBy === 'active'
                      ? 'bg-[#171c1c] text-[#00ffff] border border-[#00ffff]/40'
                      : 'text-[#839493] hover:text-[#dfe3e3]'
                  }`}
                >
                  Active
                </button>
              </div>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs font-bold font-grotesk uppercase whitespace-nowrap transition border ${
                  selectedCategory === 'all'
                    ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff]'
                    : 'bg-[#171c1c] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                All Boards ({topics.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1 text-xs font-bold font-grotesk uppercase whitespace-nowrap transition border flex items-center gap-1.5 ${
                    selectedCategory === cat.slug
                      ? 'bg-[#171c1c] border-current text-[#dfe3e3]'
                      : 'bg-[#171c1c] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]'
                  }`}
                  style={{
                    borderColor: selectedCategory === cat.slug ? cat.color : undefined,
                    color: selectedCategory === cat.slug ? cat.color : undefined,
                  }}
                >
                  {getCategoryIcon(cat.icon)}
                  {cat.name} ({cat.topicCount})
                </button>
              ))}
            </div>

            {/* Topics Feed */}
            {loading ? (
              <div className="chitin-card p-12 text-center text-xs text-[#839493]">
                Loading Neural Feed Transmissions...
              </div>
            ) : topics.length === 0 ? (
              <div className="chitin-card p-12 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-[#839493] mx-auto opacity-50" />
                <p className="text-xs text-[#839493]">
                  No topics found matching your criteria.
                </p>
                <button
                  onClick={() => setShowNewTopicModal(true)}
                  className="px-3 py-1.5 bg-[#ff5540] text-black text-xs font-bold font-grotesk uppercase"
                >
                  Start First Discussion
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleOpenTopic(topic.slug)}
                    className="chitin-card p-4 chamfer-corner space-y-3 border border-[#3a4a49] hover:border-[#00ffff]/60 transition cursor-pointer group shadow-lg"
                  >
                    {/* Header line: Category pill, Pinned icon, Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-[10px] font-bold uppercase font-grotesk border"
                          style={{
                            borderColor: topic.categoryColor || '#00ffff',
                            color: topic.categoryColor || '#00ffff',
                          }}
                        >
                          {topic.categoryName}
                        </span>

                        {topic.isPinned && (
                          <span className="text-[10px] bg-[#ff5540]/20 text-[#ff5540] border border-[#ff5540] px-1.5 py-0.5 font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3" /> PINNED
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-[#839493]">
                        {new Date(topic.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-grotesk font-bold text-base text-[#dfe3e3] group-hover:text-[#00ffff] transition leading-snug">
                      {topic.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-[#839493] line-clamp-2 leading-relaxed font-mono">
                      "{topic.content}"
                    </p>

                    {/* Footer bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#3a4a49]/60 text-xs text-[#839493]">
                      <div className="flex items-center gap-2">
                        <img
                          src={topic.authorAvatar}
                          alt={topic.authorName}
                          className="w-5 h-5 rounded border border-[#3a4a49] object-cover"
                        />
                        <span className="font-grotesk font-bold text-xs text-[#dfe3e3]">
                          {topic.authorName}
                        </span>
                        {getStageBadge(topic.authorStage)}
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => handleUpvote(topic.id, e)}
                          className={`flex items-center gap-1 hover:text-[#ff5540] transition ${
                            upvotedTopics.has(topic.id) ? 'text-[#ff5540] font-bold' : ''
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{topic.upvotes}</span>
                        </button>

                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#00ffff]" />
                          <span>{topic.repliesCount}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{topic.views}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Info Box & Boards Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Directives Banner Card */}
            <div className="chitin-card p-4 chamfer-corner space-y-3 shadow-2xl border border-[#3a4a49]">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
                <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ff5540]" />
                  COMMUNITY DIRECTIVES
                </h3>
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="text-[10px] text-[#00ffff] hover:underline font-bold"
                >
                  VIEW ALL
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#030606] border border-[#ff5540]/40 chamfer-corner space-y-1">
                  <span className="text-[10px] text-[#ff5540] font-bold uppercase tracking-wider block">
                    DIRECTIVE #1: CIVILITY & REASON
                  </span>
                  <p className="text-[10px] text-[#839493] leading-normal font-mono">
                    "Maintain intellectual rigor and mutual respect across all initiate stages."
                  </p>
                </div>
                <div className="p-2.5 bg-[#030606] border border-[#00ffff]/40 chamfer-corner space-y-1">
                  <span className="text-[10px] text-[#00ffff] font-bold uppercase tracking-wider block">
                    DIRECTIVE #5: SAFETY & POSITIVITY
                  </span>
                  <p className="text-[10px] text-[#839493] leading-normal font-mono">
                    "Beneath our biomechanical HUD aesthetic, Safety and Positivity are core non-negotiable tenets."
                  </p>
                </div>
              </div>
            </div>

            {/* Forum Boards Categories Breakdown */}
            <div className="chitin-card p-4 chamfer-corner space-y-3 shadow-2xl border border-[#3a4a49]">
              <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase border-b border-[#3a4a49] pb-2">
                DISCUSSION BOARDS
              </h3>

              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className="p-2.5 bg-[#0d1414] border border-[#3a4a49]/60 hover:border-[#00ffff]/60 transition cursor-pointer chamfer-corner flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getCategoryIcon(cat.icon)}</div>
                      <div>
                        <div
                          className="font-grotesk text-xs font-bold"
                          style={{ color: cat.color }}
                        >
                          {cat.name}
                        </div>
                        <p className="text-[10px] text-[#839493] leading-normal line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#dfe3e3] font-bold bg-[#171c1c] px-1.5 py-0.5 border border-[#3a4a49]">
                      {cat.topicCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="chitin-card w-full max-w-2xl p-6 chamfer-corner space-y-4 border border-[#ff5540] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
              <div className="flex items-center gap-2 text-[#ff5540] font-grotesk font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                MOLTOLOGY COMMUNITY CORE DIRECTIVES
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-[#839493] hover:text-[#dfe3e3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {COMMUNITY_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-[#0d1414] border border-[#3a4a49] chamfer-corner space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-grotesk font-bold text-xs text-[#00ffff]">
                      RULE #{rule.id}: {rule.title}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                        rule.severity === 'CRITICAL'
                          ? 'bg-[#ff5540]/20 text-[#ff5540] border border-[#ff5540]'
                          : 'bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#dfe3e3] font-bold">{rule.shortSummary}</p>
                  <p className="text-xs text-[#839493] leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#3a4a49] text-right">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 bg-[#ff5540] text-black font-grotesk font-bold text-xs uppercase"
              >
                I Understand & Comply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Topic Transmission Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="chitin-card w-full max-w-2xl p-6 chamfer-corner space-y-4 border border-[#00ffff] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
              <div className="flex items-center gap-2 text-[#00ffff] font-grotesk font-bold text-sm">
                <Plus className="w-5 h-5" />
                INITIATE NEW DISCUSSION TRANSMISSION
              </div>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="text-[#839493] hover:text-[#dfe3e3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newTopicError && (
              <div className="p-3 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newTopicError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTopic} className="space-y-4">
              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-xs text-[#839493] font-bold uppercase">
                  Target Discussion Board
                </label>
                <select
                  value={newTopicCategoryId}
                  onChange={(e) => setNewTopicCategoryId(e.target.value)}
                  className="w-full bg-[#0d1414] border border-[#3a4a49] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] font-mono outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} — {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs text-[#839493] font-bold uppercase">
                  Topic Title (5 to 150 characters)
                </label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Carcinization benchmarking in subagent memory structures"
                  className="w-full bg-[#0d1414] border border-[#3a4a49] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] font-mono outline-none"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="text-xs text-[#839493] font-bold uppercase">
                  Transmission Body (Minimum 10 characters)
                </label>
                <textarea
                  rows={6}
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Elaborate on your topic or architectural proposal..."
                  className="w-full bg-[#0d1414] border border-[#3a4a49] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] font-mono outline-none resize-y"
                />
              </div>

              {/* Guardrails Reminder */}
              <div className="p-3 bg-[#070d0d] border border-[#3a4a49] text-[11px] text-[#839493] space-y-1">
                <span className="text-[#00ffff] font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00ffff]" /> Directives Check
                </span>
                <p>
                  Ensure your topic adheres to civil discussion and data security. API keys or private credentials are blocked automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 border border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3] text-xs font-bold font-grotesk uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTopic || newTopicTitle.trim().length < 5 || newTopicContent.trim().length < 10}
                  className="px-5 py-2 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold font-grotesk uppercase tracking-wider transition flex items-center gap-1.5 chamfer-corner"
                >
                  {creatingTopic ? 'Publishing...' : 'Publish Transmission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_hud/community')({
  component: CommunityRoute,
})
