import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class BucketService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.getOrThrow<string>('bucket.region'),
      credentials: {
        accessKeyId: configService.getOrThrow<string>('bucket.accessKeyId'),
        secretAccessKey: configService.getOrThrow<string>(
          'bucket.secretAccessKey',
        ),
      },
      // performance optimization
      maxAttempts: Number(3),
      requestHandler: {
        connectionTimeout: 5000,
        socketTimeout: 5000,
      },
    });

    this.bucket = configService.getOrThrow<string>('bucket.bucketName');
  }

  async getTemporaryUrl(key: string): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };

    const command = new GetObjectCommand(params);

    return getSignedUrl(this.s3Client, command, {
      expiresIn: Number(
        this.configService.getOrThrow<number>('bucket.expiration'),
      ),
    });
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);

    await this.s3Client.send(command);
  }

  async generatePresignedUrl(
    key: string,
    filename: string,
    contentType: string,
    fileSize: number,
  ): Promise<{
    url: string;
    path: string;
  }> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    };

    const command = new PutObjectCommand(params);

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: Number(
        this.configService.getOrThrow<number>('bucket.expiration'),
      ),
    });

    return { url: uploadUrl, path: key };
  }
}
