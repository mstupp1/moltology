import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { can3D, mark3DUnavailable } from '@/lib/avatar3d-support'
import { PHOTO_HEIGHT, PHOTO_WIDTH, type CommunityPhoto as Photo, type CommunityPhotoState } from '@/lib/community-photo'
import { getAuthJWTToken } from '@/lib/jwt'
import { useAppQuery, useAppQueryClient } from '@/lib/query/account'
import { FRESH } from '@/lib/query/content'
import { getCommunityPhotoFn } from '@/lib/server/api'

export const communityPhotoKey = ['content', 'community-photo'] as const

/** One try per cast per browser every few hours, so a failing upload never repeats on every visit. */
const RETRY_AFTER_MS = 6 * 60 * 60 * 1000
const memo = (hash: string) => `moltology:community-photo-tried:${hash}`
let retaking: string | null = null

function triedLately(hash: string): boolean {
  if (retaking === hash) return true
  try {
    return Date.now() - Number(localStorage.getItem(memo(hash)) ?? 0) < RETRY_AFTER_MS
  } catch {
    return false
  }
}

function rememberTry(hash: string): void {
  try {
    localStorage.setItem(memo(hash), String(Date.now()))
  } catch {
    // Private window: the try is only remembered for this visit.
  }
}

/**
 * Retake the group photo in this browser when the stored one is due, show it here at once, and
 * send it to be stored for everyone else. Only signed-in members send one.
 */
function useRetake(state: CommunityPhotoState | undefined, userId: string | null | undefined): Photo | null {
  const [fresh, setFresh] = useState<Photo | null>(null)
  const client = useAppQueryClient()
  const hash = state?.due && state.cast?.length ? state.castHash : null

  useEffect(() => {
    if (!hash || !userId || !state?.cast || triedLately(hash)) return
    const cast = state.cast
    const abort = new AbortController()
    const timer = window.setTimeout(async () => {
      if (!can3D()) return
      retaking = hash
      rememberTry(hash)
      try {
        const { renderGroupPhoto } = await import('@/lib/avatar3d/group')
        const shot = await renderGroupPhoto(cast, PHOTO_WIDTH, PHOTO_HEIGHT, abort.signal)
        if (!shot) return
        const byId = new Map(cast.map((m) => [m.id, m]))
        setFresh({
          url: shot.image,
          width: PHOTO_WIDTH,
          height: PHOTO_HEIGHT,
          takenAt: new Date().toISOString(),
          spots: shot.spots.map((s) => ({
            ...s,
            name: byId.get(s.id)!.name,
            profile: byId.get(s.id)!.profile,
          })),
        })
        // Browsers that cannot write WebP hand back a PNG: shown here, but not stored.
        if (!shot.image.startsWith('data:image/webp')) return
        const token = await getAuthJWTToken()
        const { saveCommunityPhotoFn } = await import('@/lib/server/api')
        const result = await saveCommunityPhotoFn({
          data: {
            userId,
            token: token ?? undefined,
            castHash: hash,
            image: shot.image,
            spots: shot.spots,
          },
        })
        if (result.saved) void client.invalidateQueries({ queryKey: communityPhotoKey })
      } catch (error) {
        if (error instanceof Error && error.name === 'Avatar3DUnavailable') mark3DUnavailable()
      } finally {
        retaking = null
      }
    }, 2500)
    return () => {
      abort.abort()
      window.clearTimeout(timer)
    }
  }, [hash, userId, state?.cast, client])

  return fresh
}

/**
 * The forum's group photo: every member's character together. Hover or tap a face for the
 * member's name; click it, or tap it again, to open their profile.
 */
export function CommunityPhoto() {
  const { userId } = useAuthSession()
  const { data } = useAppQuery<CommunityPhotoState>({
    queryKey: communityPhotoKey,
    queryFn: () => getCommunityPhotoFn(),
    staleTime: FRESH.content,
  })
  const fresh = useRetake(data, userId)
  const photo = fresh ?? data?.photo ?? null
  const [loaded, setLoaded] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  if (!photo) return null
  const ready = loaded === photo.url

  return (
    <section
      aria-labelledby="community-photo-heading"
      className="relative overflow-hidden rounded-card border border-line-subtle bg-surface-1"
      data-testid="community-photo"
    >
      <div
        style={{
          background:
            'radial-gradient(70% 90% at 50% 105%, rgba(0,195,255,0.16) 0%, rgba(0,195,255,0.04) 45%, transparent 70%), linear-gradient(180deg, rgba(4,18,30,0.0) 0%, rgba(4,18,30,0.55) 100%)',
        }}
      >
        <div
          className="relative mx-auto w-full max-w-[920px]"
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setPicked(null)
          }}
        >
          {!ready && <div className="absolute inset-0 animate-pulse bg-surface-2/40" aria-hidden="true" />}
          <img
            src={photo.url}
            alt={`Group photo of ${photo.spots.length} members' characters`}
            width={photo.width}
            height={photo.height}
            decoding="async"
            ref={(img) => {
              // A cached image can finish before React listens for its load event.
              if (img?.complete && img.naturalWidth) setLoaded(photo.url)
            }}
            onLoad={() => setLoaded(photo.url)}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
          />
          {ready &&
            photo.spots.map((spot) => (
              <Link
                key={spot.id}
                to="/member/$profileId"
                params={{ profileId: spot.profile }}
                aria-label={spot.name}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setPicked(spot.id)
                }}
                onClick={(e) => {
                  // On touch, the first tap names the member and the second opens their profile.
                  if (picked !== spot.id) {
                    e.preventDefault()
                    setPicked(spot.id)
                  }
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
                style={{
                  left: `${spot.x * 100}%`,
                  top: `${spot.y * 100}%`,
                  width: `max(${spot.r * 200}%, 28px)`,
                  aspectRatio: '1',
                }}
              >
                <span
                  className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-control border border-line bg-surface-2/95 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-lg transition-opacity ${
                    picked === spot.id ? 'opacity-100' : 'opacity-0 group-focus-visible:opacity-100'
                  }`}
                >
                  {spot.name}
                </span>
              </Link>
            ))}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line-subtle px-3 py-2 sm:px-4">
        <Users className="h-3.5 w-3.5 text-cyan-glow" aria-hidden="true" />
        <h2 id="community-photo-heading" className="font-grotesk text-xs font-bold uppercase tracking-[0.08em] text-ink">
          Community
        </h2>
        <span className="text-[11px] text-ink-muted">{photo.spots.length === 1 ? '1 member' : `${photo.spots.length} members`}</span>
      </div>
    </section>
  )
}
