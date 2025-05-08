import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
  @Get(':id')
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
  @UseInterceptors(FileInterceptor('image'))
  updateOne(
    @Param('id') id: ObjectId,
    @UploadedFile() image: Express.Multer.File,
    @Body() userData: UpdateUserDto,
  ) {
    return this.userService.update(id, userData, image);
  }

  @Put('/accept/:id')
  acceptUser(@Param('id') id: ObjectId) {
    return this.userService.acceptUser(id);
  }
  @Put('/reject/:id')
  rejectUser(@Param('id') id: ObjectId) {
    return this.userService.rejectUser(id);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: ObjectId) {
    return this.userService.deleteOne(id);
  }
  @Delete()
  deleteAll() {
    return this.userService.deleteAll();
  }
}
