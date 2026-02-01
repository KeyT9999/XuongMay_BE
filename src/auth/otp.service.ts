import { Injectable, BadRequestException } from '@nestjs/common';

interface OtpData {
  otp: string;
  expiresAt: number;
  identifier: string;
}

@Injectable()
export class OtpService {
  private otpStore: Map<string, OtpData> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_LENGTH = 6;

  generateOtp(identifier: string): string {
    // #region agent log
    const fs = require('fs');
    const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'otp.service.ts:generateOtp',message:'generateOtp called',data:{identifier:identifier?identifier.substring(0,3)+'***':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
    } catch(e) {}
    // #endregion
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000;

    // Store OTP with identifier
    const key = identifier.toLowerCase();
    this.otpStore.set(key, {
      otp,
      expiresAt,
      identifier: key,
    });
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'otp.service.ts:generateOtp',message:'OTP stored',data:{otpLength:otp.length,expiresAt,storeSize:this.otpStore.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
    } catch(e) {}
    // #endregion

    // Clean up expired OTPs
    this.cleanupExpiredOtps();

    return otp;
  }

  verifyOtp(identifier: string, otp: string): boolean {
    const key = identifier.toLowerCase();
    const otpData = this.otpStore.get(key);

    if (!otpData) {
      return false;
    }

    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(key);
      return false;
    }

    if (otpData.otp !== otp) {
      return false;
    }

    // OTP is valid, remove it (one-time use)
    this.otpStore.delete(key);
    return true;
  }

  private cleanupExpiredOtps(): void {
    const now = Date.now();
    for (const [key, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(key);
      }
    }
  }
}
