import fs from 'node:fs'
import path from 'node:path'
import { uploadObject, DEFAULT_BUCKET } from '../s3-client'

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    case '.mp3':
      return 'audio/mpeg'
    case '.m4a':
      return 'audio/mp4'
    case '.wav':
      return 'audio/wav'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.mov':
      return 'video/quicktime'
    default:
      return 'application/octet-stream'
  }
}

export function getPublicS3Url(key: string, bucket = DEFAULT_BUCKET): string {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech'
  const cleanEndpoint = endpoint.replace(/\/+$/, '')
  const cleanKey = key.replace(/^\/+/, '')
  return `${cleanEndpoint}/${bucket}/${cleanKey}`
}

export async function uploadLocalFileToS3(
  localFilePath: string,
  targetKey?: string,
  bucket = DEFAULT_BUCKET
): Promise<{ key: string; publicUrl: string; size: number }> {
  const resolved = path.resolve(process.cwd(), localFilePath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Local file does not exist: "${localFilePath}"`)
  }

  const fileBuffer = fs.readFileSync(resolved)
  const contentType = getMimeType(resolved)
  const ext = path.extname(resolved)
  const key = targetKey || `images/blog/${path.basename(resolved, ext)}-${Date.now()}${ext}`

  await uploadObject({
    key,
    body: fileBuffer,
    contentType,
    bucket,
  })

  const publicUrl = getPublicS3Url(key, bucket)
  return { key, publicUrl, size: fileBuffer.length }
}
