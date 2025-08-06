// src/test/setup/mock-email-service.ts
import { EmailService } from '../../services/email.service';

/**
 * A mock email service for testing that doesn't try to send real emails
 * Extends EmailService but overrides the methods to avoid sending actual emails
 */
export class MockEmailService extends EmailService {
  // Track sent emails for verification in tests
  public sentEmails: Array<{
    to: string;
    subject: string;
    token?: string;
  }> = [];

  constructor() {
    super();
    console.log('Using MockEmailService for tests');
  }

  // Override the sendVerificationEmail method
  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    console.log(`[MOCK] Sending verification email to ${email} with token ${token}`);
    this.sentEmails.push({
      to: email,
      subject: 'Verify Your Email',
      token
    });
    // Don't actually try to send an email
    return Promise.resolve();
  }

  // Override the sendPasswordResetEmail method
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    console.log(`[MOCK] Sending password reset email to ${email} with token ${token}`);
    this.sentEmails.push({
      to: email,
      subject: 'Reset Your Password',
      token
    });
    // Don't actually try to send an email
    return Promise.resolve();
  }
}