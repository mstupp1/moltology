import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MOLTOLOGY_BUCKETS = {
  PUBLIC_ASSETS: "moltology-public-assets",
  USER_UPLOADS: "moltology-user-uploads",
  VAULT_DOWNLOADS: "moltology-vault-downloads",
} as const;

export const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET || MOLTOLOGY_BUCKETS.PUBLIC_ASSETS;


export function getS3Config() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-2";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Neon S3 credentials in environment variables (AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
  }

  return {
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  };
}

export function createS3Client(): S3Client {
  return new S3Client(getS3Config());
}

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = createS3Client();
  }
  return s3ClientInstance;
}

export async function ensureBucketExists(bucket: string = DEFAULT_BUCKET): Promise<void> {
  const client = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
    } else {
      // If HeadBucket is not allowed or supported, try CreateBucket directly
      try {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      } catch (createErr) {
        // Ignore if bucket already exists
      }
    }
  }
}

export const PUBLIC_ASSET_CACHE_CONTROL = 'public, max-age=31536000'

export async function uploadObject(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  bucket?: string;
}): Promise<void> {
  const client = getS3Client();
  const bucketName = params.bucket || DEFAULT_BUCKET;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: PUBLIC_ASSET_CACHE_CONTROL,
    })
  );
}

export async function getPresignedViewUrl(
  key: string,
  bucket: string = DEFAULT_BUCKET,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
