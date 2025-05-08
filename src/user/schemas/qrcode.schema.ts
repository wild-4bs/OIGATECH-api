import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Qrcode {
  @Prop({ required: true })
  url: string;
  @Prop({ required: true })
  public_id: string;
}

export const qrcodeSchema = SchemaFactory.createForClass(Qrcode);
