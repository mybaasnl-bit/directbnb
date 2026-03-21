import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    this.enabled = !!(cloudName && apiKey && apiSecret);

    if (this.enabled) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.logger.log('Cloudinary initialized');
    } else {
      this.logger.warn('Cloudinary not configured — image uploads disabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Upload an image buffer to Cloudinary and return the secure URL.
   * @param buffer   Raw file buffer
   * @param mimetype e.g. 'image/jpeg'
   * @param folder   Cloudinary folder (default: 'directbnb')
   */
  async uploadImage(
    buffer: Buffer,
    mimetype: string,
    folder = 'directbnb',
  ): Promise<string> {
    if (!this.enabled) {
      throw new BadRequestException('Image upload is not configured on this server.');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException(`Unsupported image type: ${mimetype}. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Convert buffer to base64 data URI for the Cloudinary SDK
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${base64}`;

    const result: UploadApiResponse = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      transformation: [
        // Auto-format and quality, max 2000px wide
        { width: 2000, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    this.logger.log(`Uploaded image to Cloudinary: ${result.public_id} (${result.bytes} bytes)`);
    return result.secure_url;
  }
}
