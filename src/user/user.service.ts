import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FullUserType, User } from './schemas/user.schema';
import { isValidObjectId, Model, ObjectId, Types } from 'mongoose';
import { Badge } from './schemas/badge.schema';
import { Image } from './schemas/image.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { QrcodeService } from 'src/qrcode/qrcode.service';
import { Qrcode } from './schemas/qrcode.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { Company } from 'src/company/schemas/company.schema';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Image.name) private readonly imageModel: Model<Image>,
    @InjectModel(Qrcode.name) private readonly qrcodeModel: Model<Qrcode>,
    @InjectModel(Badge.name) private readonly badgeModel: Model<Badge>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly qrcodeService: QrcodeService,
  ) {}
  //   Fetch
  async findAll(page = 1, limit = 30, email?: string, status?: string) {
    const filter: Record<string, any> = {};

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (status && status != 'all') {
      filter.status = status;
    }
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('image')
        .populate('qrcode')
        .populate('badge')
        .populate('company'),
      this.userModel.countDocuments(filter),
    ]);
    return {
      message: 'Users have been fetched successfully.',
      payload: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: ObjectId) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid user id.');
    const user = await this.userModel
      .findById(id)
      .populate('image')
      .populate('qrcode')
      .populate('badge')
      .populate('company');
    if (!user) throw new NotFoundException('User not found.');
    return {
      message: 'User have been fetched successfully.',
      payload: user,
    };
  }
  // Register
  async createUser(userData: CreateUserDto, image: Express.Multer.File) {
    try {
      if (!image)
        throw new BadRequestException({
          message: 'Image is required',
          fieldErrors: { image: 'Image is required.' },
        });
      const { public_id, secure_url } =
        await this.cloudinaryService.uploadImage(image);
      const createdImage = await this.imageModel.create({
        url: secure_url,
        public_id,
      });

      const buffer = await this.qrcodeService.generatePng(
        `
        Full name: ${userData.first_name} ${userData.last_name}
        Email: ${userData.email}
        Phone number: ${userData.phone_number}
        Position: ${userData.position}
        Company name: ${userData.company_name}
        Send via: ${userData.send_via}
        Participation type: ${userData.participation_type}
        `,
      );

      const { public_id: qrcode_id, secure_url: qrcode_url } =
        await this.cloudinaryService.uploadBuffer(buffer, 'qr-codes');
      const createdQrcode = await this.qrcodeModel.create({
        public_id: qrcode_id,
        url: qrcode_url,
      });
      if (userData.participation_type == 'exhibitor') {
        const company = await this.companyModel
          .findOne({
            name: userData.company_name,
          })
          .populate('users');

        if (!company) throw new NotFoundException('Company is not found.');
        if (company.users.length >= company.users_limit)
          throw new ForbiddenException(
            'Sorry, the company have reached the users limit.',
          );
        const createdUser: User = await this.userModel.create({
          ...userData,
          image: new Types.ObjectId(createdImage._id),
          qrcode: new Types.ObjectId(createdQrcode._id),
          company: new Types.ObjectId(company._id),
        });
        return {
          message: 'User registered successfully.',
          payload: createdUser,
        };
      }
      const createdUser: User = await this.userModel.create({
        ...userData,
        image: new Types.ObjectId(createdImage._id),
        qrcode: new Types.ObjectId(createdQrcode._id),
      });

      return {
        message: 'User registered successfully.',
        payload: createdUser,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: ObjectId,
    dataToUpdate: UpdateUserDto,
    image?: Express.Multer.File,
  ) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid user id.');
    const user = (await this.userModel
      .findById(id)
      .populate('image')
      .populate('qrcode')
      .populate('badge')
      .populate('company')) as FullUserType | null;
    if (!user) throw new NotFoundException('User is not found.');
    try {
      if (image) {
        await this.cloudinaryService.deleteImage(user?.image?.public_id);
        if (user.badge) {
          await this.cloudinaryService.deleteImage(user.badge?.public_id);
        }
        await this.imageModel.deleteOne({
          _id: user?.image?._id,
        });
        const { public_id, secure_url } =
          await this.cloudinaryService.uploadImage(image);
        const updatedImage = await this.imageModel.create({
          public_id,
          url: secure_url,
        });
        await this.userModel.updateOne(
          { _id: user._id },
          { image: updatedImage._id },
        );
      }
      await this.userModel.updateOne({ _id: id }, { ...dataToUpdate });
      const updatedUser = await this.userModel.findById(id);
      if (!updatedUser)
        throw new NotFoundException('User not found after the process.');
      await this.cloudinaryService.deleteImage(user?.qrcode?.public_id);
      const buffer = await this.qrcodeService.generatePng(
        `
        Full name: ${updatedUser.first_name} ${updatedUser.last_name}
        Email: ${updatedUser.email}
        Phone number: ${updatedUser.phone_number}
        Position: ${updatedUser.position}
        Company name: ${updatedUser.company_name}
        Send via: ${updatedUser.send_via}
        Participation type: ${updatedUser.participation_type}
        `,
      );
      const { public_id, secure_url } =
        await this.cloudinaryService.uploadBuffer(buffer, 'qr-codes');
      await this.qrcodeModel.updateOne(
        { _id: user.qrcode._id },
        {
          public_id,
          url: secure_url,
        },
      );
      return {
        message: 'User updated successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException(JSON.stringify(error.message));
    }
  }

  async deleteOne(id: ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('User is is not valid.');
    const user = (await this.userModel
      .findById(id)
      .populate('image')
      .populate('qrcode')) as FullUserType | null;
    if (!user) throw new NotFoundException('User not found.');
    await this.cloudinaryService.deleteImage(user?.image?.public_id);
    await this.cloudinaryService.deleteImage(user?.qrcode?.public_id);
    if (user.badge) {
      await this.cloudinaryService.deleteImage(user.badge?.public_id);
    }
    await this.userModel.deleteOne({ _id: id });
    return {
      message: 'User have been deleted.',
    };
  }
  async deleteAll() {
    await this.userModel.deleteMany();
    await this.cloudinaryService.deleteFolder('qr-codes');
    await this.cloudinaryService.deleteFolder('users');
    return {
      message: 'All users have been deleted.',
    };
  }

  async acceptUser(id: ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('User is is not valid.');
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User is not found.');
    await this.userModel.updateOne({ _id: id }, { status: 'accepted' });
    return {
      message: 'User have been accepted successfully.',
    };
  }

  async rejectUser(id: ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('User is is not valid.');
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User is not found.');
    await this.userModel.updateOne({ _id: id }, { status: 'rejected' });
    return {
      message: 'User have been rejected successfully.',
    };
  }
}
