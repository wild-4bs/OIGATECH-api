import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Company {
  @Prop({ required: true, unique: true })
  name: string;
  @Prop({ required: true })
  users_limit: number;
  users: User[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
});
