import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ObjectId } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { PdfService } from 'src/pdf/pdf.service';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Workbook } from 'exceljs';
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @UseGuards(AuthGuard())
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('email') email?: string,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll(page, limit, email, status);
  }

  @Get('download/pdf')
  async downloadPdf(@Res() res: Response) {
    const users = await this.userService.findAllWithoutPagination();
    if (!users) throw new NotFoundException('Users not found');

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true,
      autoFirstPage: false,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=users-list.pdf');
    doc.pipe(res);

    doc.addPage();

    const primaryColor = '#3366CC';
    const secondaryColor = '#E6EEF9';
    const borderColor = '#CCCCCC';
    const textColor = '#333333';

    const pageWidth = doc.page.width - 80;

    doc.rect(40, 40, pageWidth, 60).fill(primaryColor);

    doc
      .fontSize(24)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Users List', 40, 60, {
        align: 'center',
        width: pageWidth,
      });

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .font('Helvetica')
      .text(`Date: ${currentDate}`, 40, 85, {
        align: 'center',
        width: pageWidth,
      });

    let yPosition = 130;

    doc
      .fontSize(12)
      .fillColor(textColor)
      .font('Helvetica-Bold')
      .text(`Total Users: ${users.length}`, 40, yPosition);

    yPosition += 30;

    users.forEach((user, index) => {
      const boxHeight = 210;

      doc
        .rect(40, yPosition, pageWidth, boxHeight)
        .fill(index % 2 === 0 ? secondaryColor : '#FFFFFF');

      doc.rect(40, yPosition, 50, 30).fillAndStroke(primaryColor, borderColor);

      doc
        .fontSize(14)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text(`${index + 1}`, 40, yPosition + 8, {
          width: 50,
          align: 'center',
        });

      const userData = [
        [
          { label: 'First name', value: user.first_name },
          { label: 'Last name', value: user.last_name },
          { label: 'Email', value: user.email },
        ],
        [
          { label: 'Phone number', value: user.phone_number },
          { label: 'Position', value: user.position },
          { label: 'Company name', value: user.company_name },
        ],
        [
          { label: 'Participation type', value: user.participation_type },
          { label: 'Send via', value: user.send_via },
          { label: 'Status', value: user.status || 'active' },
        ],
      ];

      let rowY = yPosition + 35;
      userData.forEach((row) => {
        let colX = 40;
        const colWidth = pageWidth / 3 - 10;

        row.forEach((entry) => {
          doc
            .rect(colX, rowY, colWidth, 25)
            .fillAndStroke('#F5F5F5', borderColor);

          doc
            .fontSize(10)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text(entry.label, colX + 5, rowY + 5, {
              width: colWidth - 10,
              align: 'left',
            });

          doc
            .rect(colX, rowY + 25, colWidth, 30)
            .fillAndStroke('#FFFFFF', borderColor);

          doc
            .fontSize(11)
            .fillColor(textColor)
            .font('Helvetica')
            .text(entry.value || '--', colX + 5, rowY + 30, {
              width: colWidth - 10,
              align: 'left',
            });

          colX += colWidth + 10;
        });

        rowY += 60;
      });

      yPosition += boxHeight + 20;

      if (
        yPosition + boxHeight > doc.page.height - 50 &&
        index < users.length - 1
      ) {
        doc.addPage();

        doc.rect(40, 40, pageWidth, 40).fill(primaryColor);

        doc
          .fontSize(16)
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .text('Users List', 40, 50, {
            align: 'center',
            width: pageWidth,
          });

        yPosition = 100;
      }
    });

    const pageCount = (doc as any).bufferedPageCount;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc
        .lineWidth(1)
        .rect(40, doc.page.height - 50, pageWidth, 0.5)
        .stroke(borderColor);

      doc
        .fontSize(10)
        .fillColor(textColor)
        .font('Helvetica')
        .text(`Page ${i + 1} of ${pageCount}`, 40, doc.page.height - 40, {
          align: 'center',
          width: pageWidth,
        });
    }

    doc.end();
  }

  @Get('download/excel')
  async downloadExcel(@Res() res: Response) {
    const users = await this.userService.findAllWithoutPagination();
    if (!users || users.length === 0)
      throw new NotFoundException('Users not found');

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // إعداد الأعمدة
    worksheet.columns = [
      { header: '#', key: 'index', width: 5 },
      { header: 'First Name', key: 'first_name', width: 20 },
      { header: 'Last Name', key: 'last_name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phone_number', width: 15 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Company Name', key: 'company_name', width: 25 },
      { header: 'Participation Type', key: 'participation_type', width: 20 },
      { header: 'Send Via', key: 'send_via', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
    ];

    // إضافة الصفوف
    users.forEach((user, index) => {
      worksheet.addRow({
        index: index + 1,
        first_name: user.first_name || '--',
        last_name: user.last_name || '--',
        email: user.email || '--',
        phone_number: user.phone_number || '--',
        position: user.position || '--',
        company_name: user.company_name || '--',
        participation_type: user.participation_type || '--',
        send_via: user.send_via || '--',
        status: user.status || 'active',
      });
    });

    // تنسيق العناوين
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // إرسال الملف للمستخدم
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users-list.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
  // Download finished
  @Get(':id')
  @UseGuards(AuthGuard())
  findOne(@Param('id') id: ObjectId) {
    return this.userService.findOne(id);
  }

  @Post('/register')
  @UseInterceptors(FileInterceptor('image'))
  createUser(
    @UploadedFile() image: Express.Multer.File,
    @Body() userData: CreateUserDto,
  ) {
    return this.userService.createUser(userData, image);
  }

  @Put(':id')
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('image'))
  updateOne(
    @Param('id') id: ObjectId,
    @UploadedFile() image: Express.Multer.File,
    @Body() userData: UpdateUserDto,
  ) {
    return this.userService.update(id, userData, image);
  }

  @Put('/accept/:id')
  @UseGuards(AuthGuard())
  acceptUser(@Param('id') id: ObjectId) {
    return this.userService.acceptUser(id);
  }
  @Put('/reject/:id')
  @UseGuards(AuthGuard())
  rejectUser(@Param('id') id: ObjectId) {
    return this.userService.rejectUser(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  deleteOne(@Param('id') id: ObjectId) {
    return this.userService.deleteOne(id);
  }
  @Delete()
  @UseGuards(AuthGuard())
  deleteAll() {
    return this.userService.deleteAll();
  }
}
