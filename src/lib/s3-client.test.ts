import { describe, it, expect } from "vitest";
import { getS3Config, DEFAULT_BUCKET } from "./s3-client";

describe("s3-client", () => {
  it("should return valid configuration from environment variables", () => {
    const config = getS3Config();
    expect(config.endpoint).toContain("neon.tech");
    expect(config.credentials.accessKeyId).toBeDefined();
    expect(config.credentials.secretAccessKey).toBeDefined();
    expect(config.forcePathStyle).toBe(true);
  });

  it("should have a default bucket configured as moltology-public-assets", () => {
    expect(DEFAULT_BUCKET).toBe("moltology-public-assets");
  });
});

