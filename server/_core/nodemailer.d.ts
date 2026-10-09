declare module "nodemailer" {
  export interface SmtpOptions {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  }

  export interface SentMessage {
    messageId?: string;
  }

  export interface Transporter {
    sendMail(options: {
      from: string;
      to: string;
      subject: string;
      text: string;
    }): Promise<SentMessage>;
  }

  export function createTransport(options: SmtpOptions): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
