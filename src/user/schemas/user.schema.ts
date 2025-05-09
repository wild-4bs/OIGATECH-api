import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Mongoose, ObjectId, Types } from 'mongoose';
import { Company } from 'src/company/schemas/company.schema';

export type FullUserType = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  position: string;
  company_name: string;
  participation_type: string;
  send_via: string;
  image: {
    _id: string;
    url: string;
    public_id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  qrcode: {
    _id: string;
    url: string;
    public_id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  company: {
    name: string;
    users_limit: number;
  };
  badge: {
    _id: string;
    url: string;
    public_id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export enum participation_type {
  EXHIBITOR = 'exhibitor',
  ORGANIZER = 'organizer',
  VISITOR = 'visitor',
  PRESS = 'press',
}

export enum send_via {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
}

export enum status {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true })
  first_name: string;
  @Prop({ required: true })
  last_name: string;
  @Prop({ required: true })
  email: string;
  @Prop({ required: true })
  phone_number: string;
  @Prop({ required: true })
  position: string;
  @Prop({ required: true })
  company_name: string;
  @Prop({ required: true })
  participation_type: participation_type;
  @Prop({ required: true })
  send_via: send_via;
  @Prop({ type: Types.ObjectId, ref: 'Image', required: true })
  image: ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Badge', required: false })
  badge: ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Qrcode', required: true })
  qrcode: ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: false })
  company: ObjectId;
  @Prop({ required: true, default: 'pending' })
  status: status;
}

export const userSchema = SchemaFactory.createForClass(User);
