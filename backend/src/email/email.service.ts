import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { Resend } from 'resend'; // uncomment when ready to wire

// Stub email service — Resend is installed but not yet wired.
// When ready: set RESEND_API_KEY in .env, uncomment the import + client,
// and replace the log statement in send() with resend.emails.send(...)

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  // private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    // this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async send(params: SendEmailParams): Promise<void> {
    this.logger.log(
      `[EMAIL STUB] To: ${params.to} | Subject: ${params.subject}`,
    );
    // await this.resend.emails.send({
    //   from: params.from ?? 'Sneaker Doctor <no-reply@sneakerdoctor.com>',
    //   to: params.to,
    //   subject: params.subject,
    //   html: params.html,
    // });
  }
}
