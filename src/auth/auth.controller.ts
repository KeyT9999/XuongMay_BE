import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ForgotPasswordDto, VerifyOtpDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDto } from '../users/dto/user.dto';
import { UserRole } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('roles')
  getRoles() {
    return {
      roles: Object.values(UserRole).map(role => ({
        value: role,
        label: this.getRoleLabel(role),
      })),
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<UserDto> {
    return req.user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    // #region agent log
    const fs = require('fs');
    const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'auth.controller.ts:forgot-password',message:'Forgot password endpoint called',data:{identifier:forgotPasswordDto.identifier?forgotPasswordDto.identifier.substring(0,3)+'***':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');
    } catch(e) {}
    // #endregion
    try {
      const result = await this.authService.forgotPassword(forgotPasswordDto);
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.controller.ts:forgot-password',message:'Forgot password success',data:{message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');
      } catch(e) {}
      // #endregion
      return result;
    } catch (error: any) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.controller.ts:forgot-password',message:'Forgot password error',data:{errorMessage:error?.message,statusCode:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');
      } catch(e) {}
      // #endregion
      throw error;
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    return this.authService.resetPassword(verifyOtpDto);
  }

  private getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.TECH]: 'Kỹ Thuật',
      [UserRole.ACCOUNTANT]: 'Kế Toán',
      [UserRole.PLANNER]: 'Kế Hoạch',
      [UserRole.WAREHOUSE]: 'Kho Vật Tư',
      [UserRole.HR]: 'Nhân Sự',
      [UserRole.FACTORY_MANAGER]: 'Quản Lý Xưởng',
      [UserRole.ADMIN]: 'Quản Trị Viên',
    };
    return labels[role] || role;
  }
}
