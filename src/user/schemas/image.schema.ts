import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Image {
  @Prop({ required: true })
  url: string;
  @Prop({ required: true })
  public_id: string;
}

export const imageSchema = SchemaFactory.createForClass(Image);
