
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: Number(this.configService.get<string>('EMAIL_PORT') ?? 587),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const appUrl =
      this.configService.get<string>('CLIENT_ORIGIN') ??
      'http://localhost:5173';

    const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('EMAIL_FROM'),
        to: email,
        subject: 'Verify your Community Repair & Swap Circle account',
        text: `Verify your email using this link: ${verificationUrl}\nThis link expires in 15 minutes.`,
        html: `
          <h2>Verify your email</h2>
          <p>Click the link below to verify your Community Repair & Swap Circle account.</p>
          <p><a href="${verificationUrl}">Verify email</a></p>
          <p>This link expires in 15 minutes.</p>
        `,
      });
 } catch (error) {
  this.logger.error(
    'Failed to send verification email',
    error instanceof Error ? error.stack : String(error),
  );

  throw new InternalServerErrorException(
    'Unable to send verification email. Please try again later.',
  );
}
  }
async sendEmailChangeVerification(email: string, token: string) {
  const appUrl =
    this.configService.get<string>('CLIENT_ORIGIN') ??
    'http://localhost:5173';

  const verificationUrl =
    `${appUrl}/confirm-email-change?token=${encodeURIComponent(token)}`;

  try {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('EMAIL_FROM'),
      to: email,
      subject: 'Confirm your new email address',
      text: `Confirm your new email address using this link: ${verificationUrl}\nThis link expires in 15 minutes.`,
      html: `
        <h2>Confirm your new email address</h2>
        <p>You requested to change your email address for Community Repair & Swap Circle.</p>
        <p><a href="${verificationUrl}">Confirm new email address</a></p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this change, you can ignore this email.</p>
      `,
    });
 } catch (error) {
  this.logger.error(
    'Failed to send email-change verification',
    error instanceof Error ? error.stack : String(error),
  );

  throw new InternalServerErrorException(
    'Unable to send email-change verification. Please try again later.',
  );
}
}
}
