import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { UserDto } from '../users/dto/user.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private frontendUrl: string;
  private fromName: string;
  private fromEmail: string;
  private replyTo: string;

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.get('email');
    const frontendConfig = this.configService.get('frontend');

    this.frontendUrl = frontendConfig?.url || 'http://localhost:5173';
    
    // Parse MAIL_FROM format: "Name <email>" or just email
    const mailFrom = process.env.MAIL_FROM || '';
    if (mailFrom) {
      const match = mailFrom.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        this.fromName = match[1].trim();
        this.fromEmail = match[2].trim();
      } else {
        this.fromEmail = mailFrom.trim();
        this.fromName = emailConfig?.fromName || 'Quản Lý Xưởng May';
      }
    } else {
      this.fromName = emailConfig?.fromName || 'Quản Lý Xưởng May';
      this.fromEmail = emailConfig?.fromEmail || emailConfig?.user || '';
    }
    
    this.replyTo = emailConfig?.replyTo || this.fromEmail;

    // Only create transporter if email config is provided
    if (emailConfig?.user && emailConfig?.password) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host || 'smtp.gmail.com',
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });
    } else {
      this.logger.warn('Email configuration is missing. Email service will be disabled.');
    }
  }

  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Handle both development and production paths
    const isProduction = __dirname.includes('dist');
    const basePath = isProduction 
      ? path.join(__dirname, '..', '..', 'src', 'email', 'templates')
      : path.join(__dirname, 'templates');
    const templatePath = path.join(basePath, `${templateName}.hbs`);
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      return handlebars.compile(templateContent);
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName} from ${templatePath}:`, error);
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email service is not configured. Skipping email to ${to}`);
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        replyTo: this.replyTo,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
      this.logger.log(`Message ID: ${info.messageId}`);
      this.logger.log(`Response: ${info.response}`);
      // #region agent log
      const fs = require('fs');
      const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'email.service.ts:sendEmail',message:'Email sendMail result',data:{messageId:info.messageId,response:info.response,accepted:info.accepted,rejected:info.rejected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      // #region agent log
      const fs = require('fs');
      const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'email.service.ts:sendEmail',message:'Email sendMail error',data:{errorMessage:error?.message,errorCode:error?.code,errorResponse:error?.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
      throw error;
    }
  }

  async sendWelcomeEmail(
    user: UserDto,
    password: string,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('welcome-email');
      const html = template({
        name: user.name,
        username: user.username,
        password: password,
        loginUrl: this.frontendUrl,
        frontendUrl: this.frontendUrl,
      });

      await this.sendEmail(
        user.email,
        'Chào mừng đến với Quản Lý Xưởng May',
        html,
      );
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${user.email}:`, error);
      // Don't throw - allow user creation even if email fails
    }
  }

  async sendUpdateEmail(
    user: UserDto,
    changes?: { field: string; oldValue: any; newValue: any }[],
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('update-email');
      const html = template({
        name: user.name,
        username: user.username,
        changes: changes || [],
        loginUrl: this.frontendUrl,
        frontendUrl: this.frontendUrl,
      });

      await this.sendEmail(
        user.email,
        'Thông báo cập nhật tài khoản - Quản Lý Xưởng May',
        html,
      );
    } catch (error) {
      this.logger.error(`Failed to send update email to ${user.email}:`, error);
      // Don't throw - allow update even if email fails
    }
  }

  async sendDeleteEmail(
    user: UserDto,
    reason?: string,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('delete-email');
      const html = template({
        name: user.name,
        username: user.username,
        reason: reason || 'Không có lý do cụ thể',
        frontendUrl: this.frontendUrl,
      });

      await this.sendEmail(
        user.email,
        'Thông báo vô hiệu hóa tài khoản - Quản Lý Xưởng May',
        html,
      );
    } catch (error) {
      this.logger.error(`Failed to send delete email to ${user.email}:`, error);
      // Don't throw - allow delete even if email fails
    }
  }

  async sendOtpEmail(
    user: UserDto,
    otp: string,
  ): Promise<void> {
    // #region agent log
    const fs = require('fs');
    const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'email.service.ts:sendOtpEmail',message:'sendOtpEmail called',data:{email:user.email,hasTransporter:!!this.transporter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e) {}
    // #endregion
    try {
      const template = await this.loadTemplate('otp-email');
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'email.service.ts:sendOtpEmail',message:'Template loaded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
      const html = template({
        name: user.name,
        username: user.username,
        otp: otp,
        loginUrl: this.frontendUrl,
        frontendUrl: this.frontendUrl,
      });

      await this.sendEmail(
        user.email,
        'Mã OTP đặt lại mật khẩu - Quản Lý Xưởng May',
        html,
      );
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'email.service.ts:sendOtpEmail',message:'Email sent successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
    } catch (error) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({location:'email.service.ts:sendOtpEmail',message:'Email send failed',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
      } catch(e) {}
      // #endregion
      this.logger.error(`Failed to send OTP email to ${user.email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetConfirmationEmail(
    user: UserDto,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('password-reset-confirmation-email');
      const html = template({
        name: user.name,
        username: user.username,
        loginUrl: this.frontendUrl,
        frontendUrl: this.frontendUrl,
      });

      await this.sendEmail(
        user.email,
        'Mật khẩu đã được đặt lại - Quản Lý Xưởng May',
        html,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset confirmation email to ${user.email}:`, error);
      // Don't throw - password reset is already successful
    }
  }
}
