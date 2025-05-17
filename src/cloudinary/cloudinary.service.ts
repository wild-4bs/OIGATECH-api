import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as bufferToStream from 'buffer-to-stream';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinaryInstance: typeof cloudinary,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
        {
          folder: 'users',
          overwrite: true,
          transformation: [
            {
              fetch_format: 'webp',
              width: 'auto',
              dpr: 1.0,
              flags: ['lossy', 'progressive'],
              effect: 'improve:outdoor:20',
              strip_profile: true,
              colors: 64,
              quality: 30,
            },
            {
              quality: 35,
              fetch_format: 'webp',
            },
          ],
          eager_async: true,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          result
            ? resolve(result)
            : reject(new Error('Upload result is undefined'));
        },
      );

      bufferToStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadBuffer(buffer: Buffer, folder): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'webp' },
            { effect: 'sharpen:30' },
          ],
          overwrite: true,
        },
        (error, result) => {
          error
            ? reject(error)
            : result
              ? resolve(result)
              : reject('Result is not defined');
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string) {
    return this.cloudinaryInstance.uploader.destroy(publicId);
  }
  async deleteFolder(folder: string): Promise<any> {
    try {
      await this.cloudinaryInstance.api.delete_resources_by_prefix(folder);
      return await this.cloudinaryInstance.api.delete_folder(folder);
    } catch (error) {
      throw new Error(`فشل حذف المجلد: ${error.message}`);
    }
  }

  async uploadPdfFile(
    buffer: Buffer,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: folder || 'user_badges',
          format: 'pdf',
          overwrite: true,
        },

        (error, result) => {
          if (error) return reject(error);
          result ? resolve(result) : reject(new Error('نتيجة الرفع غير محددة'));
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async deletePdfFile(public_id: string) {
    console.log(public_id);
    return this.cloudinaryInstance.uploader.destroy(public_id, {
      resource_type: 'raw',
      type: 'upload',
      invalidate: true,
    });
  }
}
