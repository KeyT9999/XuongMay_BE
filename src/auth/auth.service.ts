import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { OtpService } from './otp.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ForgotPasswordDto, VerifyOtpDto } from './dto/forgot-password.dto';
import { UserDto } from '../users/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private otpService: OtpService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async validateUser(identifier: string, password: string): Promise<UserDto | null> {
    // identifier can be username or email
    const user = await this.usersService.findByUsernameOrEmail(identifier);
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return this.usersService.findOne(user._id.toString());
  }

  async validateUserById(userId: string): Promise<UserDto | null> {
    try {
      return await this.usersService.findOne(userId);
    } catch {
      return null;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    // #region agent log
    const fs = require('fs');
    const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'forgotPassword called',data:{identifier:forgotPasswordDto.identifier?forgotPasswordDto.identifier.substring(0,3)+'***':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    } catch(e) {}
    // #endregion
    const user = await this.usersService.findByUsernameOrEmail(forgotPasswordDto.identifier);
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'findByUsernameOrEmail result',data:{userFound:!!user,userId:user?._id?.toString(),isActive:user?.isActive,email:user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    } catch(e) {}
    // #endregion
    
    if (!user) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'User not found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
      } catch(e) {}
      // #endregion
      // Don't reveal if user exists or not for security
      return { message: 'Nếu tài khoản tồn tại, mã OTP đã được gửi đến email của bạn.' };
    }

    if (!user.isActive) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'User inactive',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
      } catch(e) {}
      // #endregion
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }

    // Generate OTP
    const otp = this.otpService.generateOtp(forgotPasswordDto.identifier);
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'OTP generated',data:{otpLength:otp?.length,otp:otp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    } catch(e) {}
    // #endregion
    // Log OTP to console for debugging (remove in production)
    console.log(`[DEBUG] OTP for ${forgotPasswordDto.identifier}: ${otp}`);

    // Convert User to UserDto
    const userDto = this.usersService.findOne(user._id.toString());
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'Converting to UserDto',data:{userId:user._id.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    } catch(e) {}
    // #endregion

    // Send OTP email
    try {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'Sending OTP email',data:{email:user.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
      } catch(e) {}
      // #endregion
      const userDtoResolved = await userDto;
      await this.emailService.sendOtpEmail(userDtoResolved, otp);
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'OTP email sent successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
      } catch(e) {}
      // #endregion
    } catch (error) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'auth.service.ts:forgotPassword',message:'OTP email send failed',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
      } catch(e) {}
      // #endregion
      // Log error but don't reveal to user
      console.error('Failed to send OTP email:', error);
    }

    // Always return success message (security best practice)
    return { message: 'Nếu tài khoản tồn tại, mã OTP đã được gửi đến email của bạn.' };
  }

  async resetPassword(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    // Verify OTP
    const isValidOtp = this.otpService.verifyOtp(verifyOtpDto.identifier, verifyOtpDto.otp);
    
    if (!isValidOtp) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Find user
    const user = await this.usersService.findByUsernameOrEmail(verifyOtpDto.identifier);
    
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(verifyOtpDto.newPassword, 10);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);

    // Convert User to UserDto for email
    const userDto = await this.usersService.findOne(user._id.toString());

    // Send confirmation email
    try {
      await this.emailService.sendPasswordResetConfirmationEmail(userDto);
    } catch (error) {
      console.error('Failed to send password reset confirmation email:', error);
    }

    return { message: 'Mật khẩu đã được đặt lại thành công' };
  }
}
