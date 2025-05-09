import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { ObjectId } from 'mongoose';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto copy';
import { AuthGuard } from '@nestjs/passport';

@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  find(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('name') name?: string,
  ) {
    return this.companyService.find(page, limit, name);
  }
  @Get('/all')
  findAll() {
    return this.companyService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: ObjectId) {
    return this.companyService.findOne(id);
  }
  @Post()
  @UseGuards(AuthGuard())
  create(@Body() body: CreateCompanyDto) {
    return this.companyService.create(body);
  }
  @Put(':id')
  @UseGuards(AuthGuard())
  update(@Param('id') id: ObjectId, @Body() body: UpdateCompanyDto) {
    return this.companyService.update(id, body);
  }
  @Delete(':id')
  @UseGuards(AuthGuard())
  delete(@Param('id') id: ObjectId) {
    return this.companyService.deleteOne(id);
  }
}
