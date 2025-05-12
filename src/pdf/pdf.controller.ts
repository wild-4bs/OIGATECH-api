// pdf.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PdfService } from './pdf.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schemas/user.schema';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { Badge } from 'src/user/schemas/badge.schema';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';

@Controller('pdf')
export class PdfController {
  constructor(
    private httpService: HttpService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private pdfService: PdfService,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() image: Express.Multer.File) {
    return this.pdfService.handlePdfUpload(image);
  }
  @Get('/download/:id')
  async downloadPdf(@Param('id') id: ObjectId, @Res() res: Response) {
    if (!isValidObjectId(id))
      throw new BadRequestException('User is is not valid');
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User is not found');
    const result = await this.pdfService.generate(id);
    const badge = result.payload as Badge;
    const response = await this.httpService
      .get(badge.url, {
        responseType: 'arraybuffer',
      })
      .toPromise();
    res.set({
      'Content-type': 'application/pdf',
      'Content-Disposition': `attackment; filename=${user.first_name}.pdf`,
    });
    res.send(response?.data);
    return { user };
  }
  @Post('/debug')
  async debugToken() {
    const response = await axios.get(`https://graph.facebook.com/debug_token`, {
      params: {
        input_token: process.env.LONG_LIVED_TOKEN,
        access_token: `${process.env.APP_ID}|${process.env.APP_SECRET}`,
      },
    });
    return response.data;
  }
  @Post('/send/:id')
  @UseGuards(AuthGuard())
  sendPdf(
    @Param('id') id: ObjectId,
    @Query('send_via') send_via: 'whatsapp' | 'email',
  ) {
    if (send_via !== 'whatsapp' && send_via !== 'email')
      throw new BadRequestException(
        'Send via must be either by whatsapp or email.',
      );
    if (send_via == 'whatsapp') return this.pdfService.sendWhatsapp(id);
    if (send_via == 'email') return this.pdfService.sendEmail(id);
  }
  @Get('long_lived_token')
  @UseGuards(AuthGuard())
  longLivedToken() {
    return this.pdfService.getLongLivedToken();
  }
}
