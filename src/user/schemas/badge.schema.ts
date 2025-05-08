import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Badge {
  @Prop({ required: true })
  url: string;
  @Prop({ required: true })
  public_id: string;
}

export const badgeSchema = SchemaFactory.createForClass(Badge);
