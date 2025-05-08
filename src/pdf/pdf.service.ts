// pdf.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { isValidObjectId, Model, ObjectId, Types } from 'mongoose';
import { FullUserType, User } from 'src/user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { PDFDocument } from 'pdf-lib';
import * as sharp from 'sharp';
import { Badge } from 'src/user/schemas/badge.schema';
import path from 'path';
import fs from 'fs';
const drawWrappedText = (
  page,
  text,
  x,
  y,
  maxWidth,
  fontSize,
  lineHeight = 1.2,
) => {
  // Split text into words
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  const lineSpacing = fontSize * lineHeight;

  for (const word of words) {
    // Test line with added word
    const testLine = line ? line + ' ' + word : word;
    const textWidth = fontSize * (testLine.length * 0.6); // Approximate width calculation

    if (textWidth > maxWidth && line !== '') {
      // Draw the current line and move to next line
      page.drawText(line, { x, y: currentY, size: fontSize });
      line = word;
      currentY -= lineSpacing;
    } else {
      line = testLine;
    }
  }

  // Draw remaining text
  if (line) {
    page.drawText(line, { x, y: currentY, size: fontSize });
  }

  return currentY - lineSpacing; // Return the new Y position
};

const badgeUrls = {
  visitor:
    'https://res.cloudinary.com/dfdm8lx7v/raw/upload/v1746622659/users_badges/xcmjruegcdtrkazqojq9.pdf',
  exhibitor:
    'https://res.cloudinary.com/dfdm8lx7v/raw/upload/v1746622507/users_badges/vrqyocaa7khaomjxilqt.pdf',
  press:
    'https://res.cloudinary.com/dfdm8lx7v/raw/upload/v1746622681/users_badges/gqx8paiur02xhszcvtat.pdf',
  organizer:
    'https://res.cloudinary.com/dfdm8lx7v/raw/upload/v1746622706/users_badges/mfoo0wd3hm6wx1gs0p3h.pdf',
};

@Injectable()
export class PdfService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService,
    @InjectModel(Badge.name) private badgeModel: Model<Badge>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async generate(user_id: ObjectId) {
    try {
      if (!isValidObjectId(user_id))
        throw new BadRequestException('Invalid user id');
      const user = (await this.userModel
        .findById(user_id)
        .populate('image')
        .populate('qrcode')) as FullUserType | null;
      if (!user) throw new NotFoundException('User not found');

      // تحميل ملف PDF الأصلي
      const response = await this.httpService
        .get(badgeUrls[user.participation_type], {
          responseType: 'arraybuffer',
        })
        .toPromise();

      if (!response?.data) {
        throw new Error('Failed to download PDF file');
      }

      const imageResopnse = await this.httpService
        .get(user?.image?.url, {
          responseType: 'arraybuffer',
        })
        .toPromise();

      const qrcodeResponse = await this.httpService
        .get(user?.qrcode?.url, {
          responseType: 'arraybuffer',
        })
        .toPromise();

      const pngImage = await sharp(imageResopnse?.data).png().toBuffer();
      const pngQrcode = await sharp(qrcodeResponse?.data).png().toBuffer();

      const pdfDoc = await PDFDocument.load(response.data);
      const pages = pdfDoc.getPages();

      const embeddedImage = await pdfDoc.embedPng(pngImage);
      const embeddedQrcode = await pdfDoc.embedPng(pngQrcode);

      const imageDims = embeddedImage.scale(1);
      const qrcodeDims = embeddedQrcode.scale(1);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const maxWidth = 100;
        const fontSize = 15;

        page.drawImage(embeddedImage, {
          x: width - 395,
          y: height - 178,
          width: 90,
          height: 90,
        });

        page.drawImage(embeddedQrcode, {
          x: width - 374,
          y: height - 356,
          width: 70,
          height: 70,
        });

        let currentY = height - 206;
        currentY = drawWrappedText(
          page,
          `${user.first_name} ${user.last_name}`,
          20,
          currentY,
          maxWidth,
          fontSize,
        );

        currentY -= 20;
        currentY = drawWrappedText(
          page,
          user.position,
          20,
          currentY - 18,
          maxWidth,
          fontSize,
        );

        currentY -= 20;
        drawWrappedText(
          page,
          user.company_name,
          20,
          currentY - 24,
          maxWidth,
          fontSize,
        );
      });

      const modifiedPdf = await pdfDoc.save();
      const modifiedBuffer = Buffer.from(modifiedPdf);

      const { public_id, secure_url: url } =
        await this.cloudinaryService.uploadBuffer(
          modifiedBuffer,
          'users_badges',
        );
      const badge = await this.badgeModel.create({ public_id, url });
      await this.userModel.updateOne(
        { _id: user._id },
        { badge: new Types.ObjectId(badge._id) },
      );
      return {
        message: 'Badge genereted successfully.',
        payload: badge,
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
  async handlePdfUpload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const tempPath = path.resolve(`public/${Date.now()}-${file.originalname}`);
    fs.writeFileSync(tempPath, file.buffer);

    const result = await this.cloudinaryService.uploadPdfFile(tempPath);

    fs.unlinkSync(tempPath); // حذف الملف المؤقت بعد الرفع

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  }
}
