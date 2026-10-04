/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailTransport } from '#/mailer/interface/mail-transport.interface.js';
import { ResendTransport } from '#/mailer/transports/resend.transport.js';
import { SendmailTransport } from '#/mailer/transports/sendmail.transport.js';
import { SmtpTransport } from '#/mailer/transports/smtp.transport.js';

/**
 * Keeps every registered transport available, so the mailer can send through
 * the one `MAIL_MAILER` selects and still let a caller pick another per message.
 */
@Injectable()
export class MailTransportRegistry {
  private readonly transports: Map<string, MailTransport>;
  private readonly defaultTransport: MailTransport;

  constructor(
    configService: ConfigService,
    smtp: SmtpTransport,
    sendmail: SendmailTransport,
    resend: ResendTransport,
  ) {
    this.transports = new Map(
      [smtp, sendmail, resend].map((transport) => [transport.name, transport]),
    );

    const requested = configService.getOrThrow<string>('mail.default');
    const defaultTransport = this.transports.get(requested);

    if (!defaultTransport) {
      throw new Error(
        `MAIL_MAILER is set to "${requested}", which is not a registered mailer. Known mailers: ${[...this.transports.keys()].join(', ')}.`,
      );
    }

    this.defaultTransport = defaultTransport;
  }

  get default(): MailTransport {
    return this.defaultTransport;
  }

  get(name: string): MailTransport | undefined {
    return this.transports.get(name);
  }
}
