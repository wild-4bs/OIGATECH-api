// pdf.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { isValidObjectId, Model, ObjectId, Types } from 'mongoose';
import { FullUserType, User } from 'src/user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { PDFDocument } from 'pdf-lib';
import * as sharp from 'sharp';
import { Badge } from 'src/user/schemas/badge.schema';
import { firstValueFrom } from 'rxjs';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

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
    'https://res.cloudinary.com/oigatech-cloud/raw/upload/v1747721730/main-badges/aask9vxfscgehptwrcec.pdf',
  exhibitor:
    'https://res.cloudinary.com/oigatech-cloud/raw/upload/v1747721778/main-badges/d2hlumipjecnuijruv1i.pdf',
  press:
    'https://res.cloudinary.com/oigatech-cloud/raw/upload/v1747721815/main-badges/hld4id2i4twfybilnotn.pdf',
  organizer:
    'https://res.cloudinary.com/oigatech-cloud/raw/upload/v1747721840/main-badges/dupqyzzinyccxhnfvdct.pdf',
};

@Injectable()
export class PdfService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'oigatech.iraq2025@gmail.com',
      pass: 'mjwb jaws twrv bvvq',
    },
  });
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService,
    @InjectModel(Badge.name) private badgeModel: Model<Badge>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async generate(user_id: ObjectId) {
    if (!isValidObjectId(user_id))
      throw new BadRequestException('Invalid user id');
    const user = (await this.userModel
      .findById(user_id)
      .populate('image')
      .populate('qrcode')
      .populate('badge')) as FullUserType | null;
    if (!user) throw new NotFoundException('User not found');
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

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const maxWidth = 230;
      const fontSize = 12;

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

      let currentY = height - 203;
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
        currentY - 21,
        maxWidth,
        fontSize,
      );

      currentY -= 20;
      drawWrappedText(
        page,
        user.company_name,
        20,
        currentY - 27,
        maxWidth,
        fontSize,
      );
    });

    const modifiedPdf = await pdfDoc.save();
    const modifiedBuffer = Buffer.from(modifiedPdf);
    const fileSizeInBytes = modifiedBuffer.length;

    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

    if (fileSizeInMB > 10)
      throw new BadRequestException(
        'Pdf size is larger than 10mb please try again with another image.',
      );

    if (user.badge) {
      await this.cloudinaryService.deletePdfFile(user.badge.public_id);
    }
    const { public_id, secure_url: url } =
      await this.cloudinaryService.uploadPdfFile(
        modifiedBuffer,
        'users_badges',
      );
    if (!user.badge) {
      const badge = await this.badgeModel.create({ public_id, url });
      await this.userModel.updateOne(
        { _id: user._id },
        { badge: new Types.ObjectId(badge._id) },
      );
      return {
        message: 'Badge genereted successfully.',
        payload: badge,
      };
    }
    await this.badgeModel.deleteOne({ _id: user.badge._id });
    const badge = await this.badgeModel.create({ public_id, url });
    await this.userModel.updateOne(
      { _id: user._id },
      { badge: new Types.ObjectId(badge._id) },
    );
    return {
      message: 'Badge genereted successfully.',
      payload: badge,
    };
  }
  // Upload pdf
  async handlePdfUpload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const result = await this.cloudinaryService.uploadPdfFile(
      file.buffer,
      'main-badges',
    );

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  }
  // Whatsapp sender
  async sendWhatsapp(user_id: ObjectId) {
    const whatsappApiUrl =
      process.env.FACEBOOK_LINK || 'https://graph.facebook.com/v19.0';
    if (!isValidObjectId(user_id))
      throw new BadRequestException('Useer id is not valid');
    const user = await this.userModel.findById(user_id);
    if (!user) throw new NotFoundException('User is not found.');
    if (user.status != 'accepted')
      throw new BadRequestException('User is not accepted yet.');
    const endpoint = `${whatsappApiUrl}/${process.env.PHONE_ID}/messages`;
    const badge = await this.generate(user_id);

    const payload = {
      messaging_product: 'whatsapp',
      to: user.phone_number,
      type: 'template',
      template: {
        name: 'oigatech_badge',
        language: { code: 'en_US' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: {
                  link: badge.payload.url,
                  filename: `${user.first_name}_oigatech_2025.pdf`,
                },
              },
            ],
          },
          {
            type: 'body',
            parameters: [],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.LONG_LIVED_TOKEN}`,
      'Content-Type': 'application/json',
    };

    try {
      console.log('Sending WhatsApp template...');
      const { data } = await firstValueFrom(
        this.httpService.post(endpoint, payload, { headers }),
      );

      return {
        status: 'success',
        messageId: data.messages[0]?.id,
        timestamp: data.meta?.timestamp,
        message: 'Badge have been sent successfully.',
      };
    } catch (error) {
      console.error(
        'WhatsApp API Error:',
        error.response?.data || error.message,
      );

      throw new HttpException(
        {
          status: 'error',
          error: error.response?.data?.error || {
            message: 'Failed to send WhatsApp template',
            details: error.message,
          },
        },
        error.response?.status || 500,
      );
    }
  }
  // Email sender
  async sendEmail(user_id: ObjectId) {
    if (!isValidObjectId(user_id))
      throw new BadRequestException('Useer id is not valid');
    const user = await this.userModel.findById(user_id);
    if (!user) throw new NotFoundException('User is not found.');
    if (user.status != 'accepted')
      throw new BadRequestException('User is not accepted yet.');
    const badge = await this.generate(user._id as unknown as ObjectId);
    const mailOptions = {
      from: 'oigatech.iraq2025@gmail.com',
      to: user.email,
      subject: 'Your IQDEX 2025 Entry Badge',
      text: `Hello,
Your IQDEX 2025 entry badge is ready.

Download the attached badge and show it at the entrance.

📌 Note: Keep it on your phone or print it.

For inquiries, contact us.

IQDEX 2025 Team

مرحبًا،
باج الدخول لمعرض IQDEX 2025 جاهز.

حمّل الباج المرفق وأظهره عند الدخول.

📌 ملاحظة: احتفظ به على هاتفك أو اطبعه.
`,
      attachments: [
        {
          filename: `${user.first_name}_${user.last_name}_oigatech_2025.pdf`,
          path: badge.payload.url,
          contentType: 'application/pdf',
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return {
        message: 'Badge have been sent successfully.',
      };
    } catch (error) {
      throw error;
    }
  }
  getLongLivedToken = async () => {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.APP_ID,
            client_secret: process.env.APP_SECRET,
            fb_exchange_token: process.env.SHORT_TIME_TOKEN,
          },
        },
      );

      console.log('Long-Lived Token:', response.data.access_token);
      console.log('Expires in (seconds):', response.data.expires_in); // 5184000 = 60 يومًا
      return response.data.access_token;
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      throw error;
    }
  };
}
