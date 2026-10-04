/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { SendmailMailerConfig } from '#/config/mail.config.js';
import {
  MailDeliveryResult,
  MailMessage,
  MailTransport,
} from '#/mailer/interface/mail-transport.interface.js';
import { NodemailerMessageMapper } from '#/mailer/mappers/nodemailer-message.mapper.js';

@Injectable()
export class SendmailTransport implements MailTransport {
  readonly name = 'sendmail' as const;

  private readonly transporter: Transporter;

  constructor(configService: ConfigService) {
    const sendmail = configService.getOrThrow<SendmailMailerConfig>(
      'mail.mailers.sendmail',
    );

    this.transporter = createTransport({
      sendmail: true,
      path: sendmail.path,
    });
  }

  async send(message: MailMessage): Promise<MailDeliveryResult> {
    const info = await this.transporter.sendMail(
      NodemailerMessageMapper.toSendMailOptions(message),
    );

    return NodemailerMessageMapper.toDeliveryResult(this.name, info);
  }
}
