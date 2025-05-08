import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  readonly name: string;
  @IsOptional()
  @IsNumber()
  readonly users_limit: number;
}
