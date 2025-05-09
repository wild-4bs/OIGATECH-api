// pdf.module.ts
import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/user/schemas/user.schema';
import { Badge, badgeSchema } from 'src/user/schemas/badge.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Badge.name, schema: badgeSchema },
    ]),
    CloudinaryModule,
    HttpModule,
    PassportModule,
  ],
  providers: [PdfService],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}
