import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: this.config.get<string>("S3_REGION"),
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      forcePathStyle: this.config.get<string>("S3_FORCE_PATH_STYLE") === "true",
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY_ID")!,
        secretAccessKey: this.config.get<string>("S3_SECRET_ACCESS_KEY")!,
      },
    });
  }

  private get bucket(): string {
    return this.config.get<string>("S3_BUCKET")!;
  }

  async presignPut(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  publicUrl(key: string): string {
    const base = this.config.get<string>("S3_PUBLIC_BASE_URL")!;
    return `${base.replace(/\/+$/, "")}/${key}`;
  }

  /** Extrae el object key a partir de una URL pública generada por publicUrl(). */
  keyFromPublicUrl(url: string): string | null {
    const base = this.config.get<string>("S3_PUBLIC_BASE_URL")!.replace(/\/+$/, "");
    if (!url.startsWith(`${base}/`)) return null;
    return url.slice(base.length + 1);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}
