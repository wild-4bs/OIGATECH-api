import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Admin {
  @Prop({ required: true })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop({ required: true, default: false })
  badge_expired: boolean;
}

export const adminSchema = SchemaFactory.createForClass(Admin);
