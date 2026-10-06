/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

@Injectable()
export class BucketService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: configService.getOrThrow<string>('bucket.endpoint'),
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
      forcePathStyle: true,
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

  /**
   * Uploads a file directly to S3 and returns the object key.
   * Validates the MIME type against the declared attachment type before uploading.
   */
  // Maximum file sizes: 50 MB for images, 1 GB for videos
  private readonly MAX_IMAGE_SIZE = 50 * 1024 * 1024;
  private readonly MAX_VIDEO_SIZE = 1024 * 1024 * 1024;

  async uploadFile(
    file: FastifyMultipartFile,
    attachmentType: AttachmentType,
  ): Promise<string> {
    // Validate MIME type matches declared attachment type
    const isImage = [AttachmentType.IMAGE, AttachmentType.GIF].includes(
      attachmentType,
    );
    const isVideo = attachmentType === AttachmentType.VIDEO;

    if (isImage && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `Content type '${file.mimetype}' is not valid for attachment type '${attachmentType}'`,
      );
    }

    if (isVideo && !file.mimetype.startsWith('video/')) {
      throw new BadRequestException(
        `Content type '${file.mimetype}' is not valid for attachment type '${attachmentType}'`,
      );
    }

    // Validate file size against attachment type limits
    const fileSize = file.buffer.byteLength;
    if (isImage && fileSize > this.MAX_IMAGE_SIZE) {
      throw new BadRequestException(`Image files must not exceed 50 MB`);
    }

    if (isVideo && fileSize > this.MAX_VIDEO_SIZE) {
      throw new BadRequestException(`Video files must not exceed 1 GB`);
    }

    // Generate a unique key: UUID ensures uniqueness across concurrent uploads,
    // and only the file extension is kept to prevent path traversal via filenames
    const extension = file.filename.includes('.')
      ? file.filename.slice(file.filename.lastIndexOf('.'))
      : '';
    const key = `posts/${randomUUID()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: file.mimetype,
      Body: file.buffer,
    });

    await this.s3Client.send(command);

    return key;
  }
}
