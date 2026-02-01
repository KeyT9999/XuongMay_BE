import { IsString, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // username or email
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // username or email

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
