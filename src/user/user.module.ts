import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './schemas/user.schema';
import { Image, imageSchema } from './schemas/image.schema';
import { Badge, badgeSchema } from './schemas/badge.schema';
import { Qrcode, qrcodeSchema } from './schemas/qrcode.schema';
import { UserService } from './user.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { QrcodeModule } from 'src/qrcode/qrcode.module';
import { CompanyModule } from 'src/company/company.module';
import { AdminModule } from 'src/admin/admin.module';
import { PdfModule } from 'src/pdf/pdf.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Image.name, schema: imageSchema },
      { name: Badge.name, schema: badgeSchema },
      { name: Qrcode.name, schema: qrcodeSchema },
    ]),
    CloudinaryModule,
    QrcodeModule,
    CompanyModule,
    AdminModule,
    PdfModule,
    PassportModule,
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
