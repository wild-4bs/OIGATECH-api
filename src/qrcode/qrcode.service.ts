import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrcodeService {
  async generatePng(text: string): Promise<Buffer> {
    return await QRCode.toBuffer(text, { type: 'png', width: 300 });
  }

  async generateDataURL(text: string): Promise<string> {
    return await QRCode.toDataURL(text);
  }
}
