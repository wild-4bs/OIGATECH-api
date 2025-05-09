import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from './schemas/company.schema';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto copy';
import { User } from 'src/user/schemas/user.schema';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(User.name) private readonly usersModel: Model<User>,
  ) {}

  async find(page = 1, limit = 50, name?: string) {
    const matchStage = name ? { name: { $regex: name, $options: 'i' } } : {};
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      this.companyModel
        .find(matchStage)
        .skip(skip)
        .limit(limit)
        .populate('users'),
      this.companyModel.countDocuments(matchStage),
    ]);
    return {
      message: 'Companies have been fetched successfully.',
      payload: companies,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll() {
    const companies = await this.companyModel.find();
    return {
      message: 'Companies have been fetched successfully.',
      payload: companies,
    };
  }

  async findOne(id: ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid company id.');
    const company = await this.companyModel.findById(id).populate('users');
    if (!company) throw new NotFoundException('Company is not found.');
    return {
      message: 'Company have been fetched successfully.',
      payload: company,
      users_count: company.users.length,
    };
  }
  async create(data: CreateCompanyDto) {
    if (data.users_limit <= 0)
      throw new BadRequestException(
        `Users limit can't be lower or equal to zero.`,
      );
    try {
      const company = await this.companyModel.create(data);
      return {
        message: 'Company created successfully.',
        payload: company,
      };
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.name) {
        throw new ConflictException('Company name already exist.');
      }
      throw error;
    }
  }

  async update(id: ObjectId, data: UpdateCompanyDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid company id.');
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Company is not found.');
    const result = await this.companyModel.updateOne({ _id: id }, data);
    return {
      message: 'Company updated successfully.',
      payload: result,
    };
  }

  async deleteOne(id: ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid company id.');
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Company is not found.');
    const result = await this.companyModel.deleteOne({ _id: id });
    return {
      message: 'Company deleted successfully.',
      payload: result,
    };
  }
}
