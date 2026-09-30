/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ResendTransport } from './transports/resend.transport';
import { SendmailTransport } from './transports/sendmail.transport';
import { SmtpTransport } from './transports/smtp.transport';
import { MailTransportRegistry } from './transports/transport.registry';

@Module({
  providers: [
    SmtpTransport,
    SendmailTransport,
    ResendTransport,
    MailTransportRegistry,
    MailerService,
  ],
  exports: [MailerService],
})
export class MailerModule {}
