import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanySchema } from './schemas/company.schema';
import { CompanyService } from './company.service';
import { UserModule } from 'src/user/user.module';
import { userSchema } from 'src/user/schemas/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { jwtStrategy } from 'src/admin/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Company', schema: CompanySchema },
      { name: 'User', schema: userSchema },
    ]),
    JwtModule,
    PassportModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService, jwtStrategy],
  exports: [MongooseModule, PassportModule, JwtModule],
})
export class CompanyModule {}
