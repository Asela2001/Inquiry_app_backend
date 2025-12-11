import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  private createTransport() {
    // Fixed: createTransport (not createTransporter)
    return nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: +this.configService.get('SMTP_PORT'),
      secure: false, // true for 465, false for 587
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendInquiryConfirmation(
    toEmail: string,
    inquiryId: number,
    subject: string,
    summary: string,
  ) {
    const transporter = this.createTransport(); // Uses fixed method
    const appEmail = this.configService.get('APP_EMAIL');
    const appName = this.configService.get('APP_NAME');

    const mailOptions = {
      from: `"${appName}" <${appEmail}>`,
      to: toEmail,
      subject: `Inquiry Confirmation - ID #${inquiryId}`,
      html: `
        <h2>Your Inquiry Has Been Logged</h2>
        <p>Dear Requester,</p>
        <p>Your inquiry has been received and assigned ID <strong>#${inquiryId}</strong>.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Brief Summary:</strong> ${summary}</p>
        <p>We will update you on progress. Reply or call if urgent.</p>
        <p>Best,<br>${appName}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  async sendInquiryCompletion(
    toEmail: string,
    inquiryId: number,
    subject: string,
  ) {
    const transporter = this.createTransport(); // Uses fixed method
    const appEmail = this.configService.get('APP_EMAIL');
    const appName = this.configService.get('APP_NAME');

    const mailOptions = {
      from: `"${appName}" <${appEmail}>`,
      to: toEmail,
      subject: `Inquiry Complete - ID #${inquiryId}`,
      html: `
        <h2>Your Inquiry Is Complete</h2>
        <p>Dear Requester,</p>
        <p>Inquiry ID <strong>#${inquiryId}</strong> has been resolved.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>If you have questions, reply or contact us.</p>
        <p>Thank you,<br>${appName}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}