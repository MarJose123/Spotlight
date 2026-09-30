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
import { SmtpMailerConfig } from '@/config/mail.config';
import {
  MailDeliveryResult,
  MailMessage,
  MailTransport,
} from '@/mailer/interface/mail-transport.interface';
import { NodemailerMessageMapper } from '@/mailer/mappers/nodemailer-message.mapper';

@Injectable()
export class SmtpTransport implements MailTransport {
  readonly name = 'smtp' as const;

  private readonly transporter: Transporter;

  constructor(configService: ConfigService) {
    const smtp =
      configService.getOrThrow<SmtpMailerConfig>('mail.mailers.smtp');

    this.transporter = createTransport({
      ...(smtp.url ? { url: smtp.url } : {}),
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.username
        ? { user: smtp.username, pass: smtp.password }
        : undefined,
      connectionTimeout: smtp.timeout,
      socketTimeout: smtp.timeout,
    });
  }

  async send(message: MailMessage): Promise<MailDeliveryResult> {
    const info = await this.transporter.sendMail(
      NodemailerMessageMapper.toSendMailOptions(message),
    );

    return NodemailerMessageMapper.toDeliveryResult(this.name, info);
  }
}
