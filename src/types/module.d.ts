// src/types/module.d.ts
declare module 'bcrypt';
declare module 'jsonwebtoken';
declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>;
  }
  
  export function createTransport(options: any): Transporter;
  export function createTestAccount(): Promise<any>;
  export function getTestMessageUrl(info: any): string;
}