import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'avatars'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
            resolve(result.secure_url);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted: ${publicId}`, result);
    } catch (error) {
      this.logger.error(`Failed to delete image ${publicId}:`, error);
      throw error;
    }
  }

  extractPublicId(url: string): string | null {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
      // or: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{ext}
      const matches = url.match(/\/upload\/v\d+\/(.+)$/) || url.match(/\/upload\/(.+)$/);
      if (matches && matches[1]) {
        // Remove file extension
        return matches[1].replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      }
      return null;
    } catch {
      return null;
    }
  }
}
