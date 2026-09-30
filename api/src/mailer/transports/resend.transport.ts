/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  MailDeliveryResult,
  MailMessage,
  MailTransport,
} from '@/mailer/interface/mail-transport.interface';
import { ResendMessageMapper } from '@/mailer/mappers/resend-message.mapper';

@Injectable()
export class ResendTransport implements MailTransport {
  readonly name = 'resend' as const;

  private client?: Resend;

  constructor(private readonly configService: ConfigService) {}

  async send(message: MailMessage): Promise<MailDeliveryResult> {
    const { data, error } = await this.getClient().emails.send({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: message.replyTo,
      headers: message.headers,
      attachments: ResendMessageMapper.toAttachments(message.attachments),
    });

    if (error) {
      throw new Error(
        `Resend rejected the message: ${error.message} (${error.name})`,
      );
    }

    // The API answers with the id of the queued send only: it has no envelope
    // to report accepted or rejected recipients from.
    return { transport: this.name, messageId: data.id };
  }

  /**
   * Built on first use so that the API key is required only by the mailer that
   * actually needs it.
   */
  private getClient(): Resend {
    if (!this.client) {
      const key = this.configService.get<string>('mail.mailers.resend.key');

      if (!key) {
        throw new Error(
          'RESEND_API_KEY must be set to send mail through the resend mailer.',
        );
      }

      this.client = new Resend(key);
    }

    return this.client;
  }
}
