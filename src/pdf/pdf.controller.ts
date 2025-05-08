// pdf.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
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

@Controller('pdf')
export class PdfController {
  constructor(
    private httpService: HttpService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private pdfService: PdfService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() image: Express.Multer.File) {
    return this.upload(image);
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
}
