import { ObjectId } from 'mongoose';
import { participation_type, send_via, status } from '../schemas/user.schema';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name: string;
  @IsOptional()
  @IsString()
  last_name: string;
  @IsOptional()
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;
  @IsOptional()
  @IsString()
  phone_number: string;
  @IsOptional()
  @IsString()
  position: string;
  @IsOptional()
  @IsString()
  company_name: string;
  @IsOptional()
  @IsEnum(participation_type)
  participation_type: participation_type;
  @IsOptional()
  @IsEnum(send_via)
  send_via: send_via;
  @IsOptional()
  @IsMongoId()
  badge: ObjectId;
  @IsOptional()
  @IsMongoId()
  qrcode: ObjectId;
  @IsOptional()
  @IsMongoId()
  company: ObjectId;
  @IsOptional()
  @IsEnum(status)
  status: status;
}
