/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { registerAs } from '@nestjs/config';

/**
 * Mailer names a `MAIL_MAILER` value can select. Each one maps to a transport
 * registered in `MailerModule`.
 */
export type MailTransportName = 'smtp' | 'sendmail' | 'resend';

export interface SmtpMailerConfig {
  transport: 'smtp';
  scheme?: string;
  url?: string;
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  timeout: number;
}

export interface SendmailMailerConfig {
  transport: 'sendmail';
  path: string;
}

export interface ResendMailerConfig {
  transport: 'resend';
  key?: string;
}

export interface MailConfig {
  /**
   * Transport the mailer uses unless a message asks for another one. Resolved by
   * `MailTransportRegistry`, which refuses to boot when the value names no
   * registered mailer.
   */
  default: string;
  mailers: {
    smtp: SmtpMailerConfig;
    sendmail: SendmailMailerConfig;
    resend: ResendMailerConfig;
  };
  /** Global "From" address, used whenever a message does not override it. */
  from: {
    address: string;
    name: string;
  };
}

export default registerAs<MailConfig>('mail', () => {
  const port = Number(process.env.MAIL_PORT || 1025);
  const scheme = process.env.MAIL_SCHEME;

  return {
    default: process.env.MAIL_MAILER || 'smtp',
    mailers: {
      smtp: {
        transport: 'smtp',
        scheme,
        url: process.env.MAIL_URL,
        host: process.env.MAIL_HOST || '127.0.0.1',
        port,
        // Implicit TLS is what `smtps://` and the classic 465 port ask for.
        // Anything else — Mailpit's plaintext listener included — leans on the
        // STARTTLS upgrade nodemailer negotiates with the server.
        secure: scheme ? scheme === 'smtps' : port === 465,
        username: process.env.MAIL_USERNAME,
        password: process.env.MAIL_PASSWORD,
        timeout: Number(process.env.MAIL_TIMEOUT || 10000),
      },
      sendmail: {
        transport: 'sendmail',
        // Nodemailer runs this binary once per message and pipes the compiled
        // message to its stdin, so the value cannot carry sendmail flags.
        path: process.env.MAIL_SENDMAIL_PATH || '/usr/sbin/sendmail',
      },
      resend: {
        transport: 'resend',
        key: process.env.RESEND_API_KEY,
      },
    },
    from: {
      address: process.env.MAIL_FROM_ADDRESS || 'no-reply@spotlight.com',
      name: process.env.MAIL_FROM_NAME || 'Spotlight',
    },
  };
});
