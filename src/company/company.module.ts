import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanySchema } from './schemas/company.schema';
import { CompanyService } from './company.service';
import { UserModule } from 'src/user/user.module';
import { userSchema } from 'src/user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Company', schema: CompanySchema },
      { name: 'User', schema: userSchema },
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [MongooseModule],
})
export class CompanyModule {}
