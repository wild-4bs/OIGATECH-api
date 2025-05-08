import { ObjectId } from 'mongoose';
import { participation_type, send_via } from '../schemas/user.schema';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;
  @IsNotEmpty()
  @IsString()
  last_name: string;
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;
  @IsNotEmpty()
  @IsString()
  phone_number: string;
  @IsNotEmpty()
  @IsString()
  position: string;
  @IsNotEmpty()
  @IsString()
  company_name: string;
  @IsEnum(participation_type)
  participation_type: participation_type;
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
}
