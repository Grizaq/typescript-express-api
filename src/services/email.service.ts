// src/services/email.service.ts
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { config } from '../config';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a transporter based on configuration
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });

    // In development, we can use nodemailer's "ethereal" email
    if (config.nodeEnv === 'development' && !config.email.host) {
      this.createDevTransporter();
    }
  }

  private async createDevTransporter() {
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();

      // Create a testing transporter
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('Development email account created:', testAccount.web);
    } catch (error) {
      console.error('Failed to create development email account:', error);
      console.log('Email sending will be simulated in development mode');
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const mailOptions = {
      from: `"${config.appName}" <${config.email.from}>`,
      to: email,
      subject: 'Verify Your Email',
      text: `Hello ${name},\n\nPlease verify your email by entering the following code: ${token}\n\nThis code will expire in 24 hours.`,
      html: `
        <h1>Email Verification</h1>
        <p>Hello ${name},</p>
        <p>Please verify your email by entering the following code:</p>
        <h2 style="letter-spacing: 2px; font-size: 32px; text-align: center; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">${token}</h2>
        <p>This code will expire in 24 hours.</p>
        <p>Thank you,<br>${config.appName} Team</p>
      `
    };

    try {
      if (config.nodeEnv === 'development' && !config.email.host) {
        console.log('==== DEVELOPMENT MODE: EMAIL NOT ACTUALLY SENT ====');
        console.log('To:', email);
        console.log('Subject:', mailOptions.subject);
        console.log('Verification Token:', token);
        console.log('======================================================');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      
      if (config.nodeEnv === 'development') {
        console.log('Verification email sent: %s', info.messageId);
        // Check if getTestMessageUrl exists before calling it
        if (typeof nodemailer.getTestMessageUrl === 'function') {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const mailOptions = {
      from: `"${config.appName}" <${config.email.from}>`,
      to: email,
      subject: 'Reset Your Password',
      text: `Hello ${name},\n\nYou requested to reset your password. Use this code to reset your password: ${token}\n\nThis code will expire in 1 hour.`,
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Use this code to reset your password:</p>
        <h2 style="letter-spacing: 2px; font-size: 32px; text-align: center; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">${token}</h2>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can ignore this email.</p>
        <p>Thank you,<br>${config.appName} Team</p>
      `
    };

    try {
      if (config.nodeEnv === 'development' && !config.email.host) {
        console.log('==== DEVELOPMENT MODE: EMAIL NOT ACTUALLY SENT ====');
        console.log('To:', email);
        console.log('Subject:', mailOptions.subject);
        console.log('Reset Token:', token);
        console.log('======================================================');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      
      if (config.nodeEnv === 'development') {
        console.log('Password reset email sent: %s', info.messageId);
        // Check if getTestMessageUrl exists before calling it
        if (typeof nodemailer.getTestMessageUrl === 'function') {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}