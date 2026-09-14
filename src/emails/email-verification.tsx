import { render } from '@react-email/render'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from 'react-email'
import { getAssetUrl } from '../lib/assets'
import { SITE_ORIGIN } from '../lib/seo'

export const EMAIL_VERIFICATION_MAIL = {
  subject: 'Confirm your Moltology email',
  preview: 'Confirm your email to finish joining.',
  heading: 'Confirm your Moltology email',
  body: 'Open this link to finish joining.',
  button: 'Confirm email',
  ignore: 'If you did not create an account, you can ignore this message.',
} as const

const emblemPath = getAssetUrl('/images/order_emblem.png')

export const EMAIL_VERIFICATION_EMBLEM_URL = emblemPath.startsWith('http')
  ? emblemPath
  : `${SITE_ORIGIN}${emblemPath}`

export interface EmailVerificationEmailProps {
  url: string
}

/**
 * Confirm-email card modeled on Resend Protocol activation:
 * preview, heading, short body, primary button, ignore-if-not-you.
 */
export function EmailVerificationEmail({ url }: EmailVerificationEmailProps) {
  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                abyss: '#070b0b',
                plate: '#0f1414',
                seam: '#3a4a49',
                foam: '#d6e4e2',
                muted: '#839493',
                signal: '#00c3ff',
                ink: '#070b0b',
              },
            },
          },
        }}
      >
        <Head />
        <Body className="mx-auto my-auto bg-abyss px-[16px] font-sans">
          <Preview>{EMAIL_VERIFICATION_MAIL.preview}</Preview>
          <Container className="mx-auto my-[40px] max-w-[465px] rounded-[8px] border border-solid border-seam bg-plate p-[32px]">
            <Section>
              <Img
                src={EMAIL_VERIFICATION_EMBLEM_URL}
                width="48"
                height="48"
                alt="Moltology"
                className="mx-auto my-0"
              />
            </Section>
            <Heading
              as="h1"
              className="mx-0 my-[24px] p-0 text-center text-[24px] font-normal text-foam"
            >
              {EMAIL_VERIFICATION_MAIL.heading}
            </Heading>
            <Text className="text-center text-[16px] leading-[24px] text-foam">
              {EMAIL_VERIFICATION_MAIL.body}
            </Text>
            <Section className="mt-[24px] mb-[24px] text-center">
              <Button
                href={url}
                className="box-border rounded-[6px] bg-signal px-[20px] py-[12px] text-center text-[16px] font-semibold text-ink no-underline"
              >
                {EMAIL_VERIFICATION_MAIL.button}
              </Button>
            </Section>
            <Text className="m-0 text-center text-[14px] leading-[22px] text-muted">
              {EMAIL_VERIFICATION_MAIL.ignore}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

EmailVerificationEmail.PreviewProps = {
  url: 'https://moltology.org/api/auth/verify-email?token=preview',
} satisfies EmailVerificationEmailProps

export default EmailVerificationEmail

export async function renderEmailVerificationEmailHtml(url: string): Promise<string> {
  return render(<EmailVerificationEmail url={url} />)
}
