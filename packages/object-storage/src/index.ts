import * as Minio from "minio";

export type ObjectStorageConfig = {
  endPoint?: string;
  port?: number;
  useSSL?: boolean;
  accessKey?: string;
  secretKey?: string;
  defaultBucket?: string;
};

export type StoredObjectInfo = {
  etag: string;
  versionId: string | null;
};

export class ObjectStorage {
  readonly client: Minio.Client;
  readonly defaultBucket: string;

  constructor(config: ObjectStorageConfig = {}) {
    this.defaultBucket = config.defaultBucket ?? process.env.MINIO_BUCKET ?? "platform-media";
    this.client = new Minio.Client({
      endPoint: config.endPoint ?? process.env.MINIO_ENDPOINT ?? "localhost",
      port: config.port ?? Number(process.env.MINIO_PORT ?? 9000),
      useSSL: config.useSSL ?? process.env.MINIO_USE_SSL === "true",
      accessKey: config.accessKey ?? process.env.MINIO_ACCESS_KEY ?? "minio",
      secretKey: config.secretKey ?? process.env.MINIO_SECRET_KEY ?? "minio123",
    });
  }

  async ensureBucket(bucket = this.defaultBucket) {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket, "us-east-1");
    }
  }

  async putObject(
    objectKey: string,
    data: Buffer,
    meta?: Record<string, string>,
    bucket = this.defaultBucket,
  ): Promise<StoredObjectInfo> {
    await this.ensureBucket(bucket);
    return this.client.putObject(bucket, objectKey, data, data.length, meta);
  }

  async getPresignedUrl(objectKey: string, expirySeconds = 3600, bucket = this.defaultBucket) {
    return this.client.presignedGetObject(bucket, objectKey, expirySeconds);
  }

  async removeObject(objectKey: string, bucket = this.defaultBucket) {
    await this.client.removeObject(bucket, objectKey);
  }
}

let storage: ObjectStorage | null = null;

export function getObjectStorage(config?: ObjectStorageConfig) {
  if (!storage) {
    storage = new ObjectStorage(config);
  }
  return storage;
}
