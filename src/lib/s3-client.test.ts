import { describe, it, expect } from "vitest";
import { getS3Config, DEFAULT_BUCKET, PUBLIC_ASSET_CACHE_CONTROL } from "./s3-client";

describe("s3-client", () => {
  it("should return valid configuration from environment variables", () => {
    const origEndpoint = process.env.AWS_ENDPOINT_URL_S3;
    const origKey = process.env.AWS_ACCESS_KEY_ID;
    const origSecret = process.env.AWS_SECRET_ACCESS_KEY;
    try {
      process.env.AWS_ENDPOINT_URL_S3 = process.env.AWS_ENDPOINT_URL_S3 || 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech';
      process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'dummy_test_key';
      process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'dummy_test_secret';

      const config = getS3Config();
      expect(config.endpoint).toContain("neon.tech");
      expect(config.credentials.accessKeyId).toBeDefined();
      expect(config.credentials.secretAccessKey).toBeDefined();
      expect(config.forcePathStyle).toBe(true);
    } finally {
      process.env.AWS_ENDPOINT_URL_S3 = origEndpoint;
      process.env.AWS_ACCESS_KEY_ID = origKey;
      process.env.AWS_SECRET_ACCESS_KEY = origSecret;
    }
  });

  it("should have a default bucket configured as moltology-public-assets", () => {
    expect(DEFAULT_BUCKET).toBe("moltology-public-assets");
  });

  it("stamps future public uploads with long-lived Cache-Control", () => {
    expect(PUBLIC_ASSET_CACHE_CONTROL).toBe("public, max-age=31536000");
  });
})

