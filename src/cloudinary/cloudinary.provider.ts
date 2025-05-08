// cloudinary.provider.ts
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    cloudinary.config({
      cloud_name: configService.get('CLD_NAME'),
      api_key: configService.get('CLD_KEY'),
      api_secret: configService.get('CLD_SECRET'),
    });
    return cloudinary;
  },
  inject: [ConfigService],
};
