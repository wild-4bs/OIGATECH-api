import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Admin } from './schemas/admin.schema';

@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(Admin.name) private adminModel: Model<Admin>) {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is not defined in the environment variables.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload) {
    const { id } = payload;

    const admin = await this.adminModel.findById(id);
    if (!admin) throw new UnauthorizedException('You have to login first.');
    return admin;
  }
}
