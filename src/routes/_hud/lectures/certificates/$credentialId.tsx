import { createFileRoute } from '@tanstack/react-router'
import { AcademyCredential } from '@/components/academy/AcademyCertificateViews'
import { AcademyFrame, AcademyMissing } from '@/components/academy/AcademyChrome'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { ACADEMY_COPY } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyCertificateFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/lectures/certificates/$credentialId')({
  loader: async ({ params }) => {
    try {
      const credential = await getAcademyCertificateFn({ data: { credentialId: params.credentialId } })
      return { credential }
    } catch (error) {
      console.warn('Academy credential loader error:', error)
      return { credential: null }
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: loaderData?.credential
          ? `${loaderData.credential.title} | Molt Academy`
          : 'Credential | Molt Academy',
        description: loaderData?.credential?.description ?? 'A Molt Academy certification.',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
  }),
  component: AcademyCredentialRoute,
  pendingComponent: HudWorkspaceGhost,
})

function AcademyCredentialRoute() {
  const { credential } = Route.useLoaderData()
  if (!credential) return <AcademyMissing message={ACADEMY_COPY.missingCertificate} />
  return (
    <AcademyFrame>
      <AcademyCredential credential={credential} />
    </AcademyFrame>
  )
}
