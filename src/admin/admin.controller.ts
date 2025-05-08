import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Post('/login')
  login(@Body() data: LoginDto) {
    return this.adminService.login(data);
  }
  @Post('/checkAuth')
  checkAuth(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }
    return this.adminService.checkAuth(token);
  }
  @Get('/badgeCondition')
  getCondition() {
    return this.adminService.badgeCondition();
  }
  @Post('/expireBadge')
  @UseGuards(AuthGuard())
  expire() {
    return this.adminService.expireBadge();
  }
  @Post('/activeBadge')
  @UseGuards(AuthGuard())
  active() {
    return this.adminService.activeBadge();
  }
}
