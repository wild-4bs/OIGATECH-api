import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './schemas/admin.schema';
import { Model } from 'mongoose';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}
  async login(data: LoginDto) {
    const admins = await this.adminModel.find();
    if (admins.length < 1) {
      const password = await bcrypt.hash(data.password, 10);
      const admin = await this.adminModel.create({ ...data, password });
      const token = this.jwtService.sign({ id: admin._id, email: admin.email });

      return {
        message: 'Welcome admin.',
        payload: { email: admin.email, badge_expired: admin.badge_expired },
        token,
      };
    }
    const admin = await this.adminModel.findOne({ email: data.email });
    if (!admin)
      throw new NotFoundException({
        fieldErrors: { email: ['Email is not correct'] },
      });
    const passwordMatch = await bcrypt.compare(data.password, admin.password);
    if (!passwordMatch)
      throw new UnauthorizedException({
        fieldErrors: { password: ['Password is not correct.'] },
      });
    const token = this.jwtService.sign({ id: admin._id, email: admin.email });
    return {
      message: 'Welcome admin.',
      payload: {
        email: admin.email,
        badge_expired: admin.badge_expired,
      },
      token,
    };
  }
  async checkAuth(token: string) {
    try {
      const isVerfied = this.jwtService.verify(token);
      if (!isVerfied) throw new UnauthorizedException();
      return { message: 'Authorized', status: 200 };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async expireBadge() {
    const admin = await this.adminModel.findOne();
    if (!admin) throw new ConflictException('Admin is not found!');
    await this.adminModel.updateOne(
      { _id: admin._id },
      { badge_expired: true },
    );
    return {
      message: 'Badge is no longer availabel to register.',
    };
  }
  async activeBadge() {
    const admin = await this.adminModel.findOne();
    if (!admin) throw new ConflictException('Admin is not found!');
    await this.adminModel.updateOne(
      { _id: admin._id },
      { badge_expired: false },
    );
    return {
      message: 'Badge is no longer expired, user can register.',
    };
  }
  async badgeCondition() {
    const admin = await this.adminModel.findOne();
    if (!admin) throw new ConflictException('Admin is not found!');
    return {
      message: 'Badge condition have been fetched',
      condition: admin.badge_expired ? 'expired' : 'active',
    };
  }
}
