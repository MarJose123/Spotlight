/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service.js';
import { ResendTransport } from './transports/resend.transport.js';
import { SendmailTransport } from './transports/sendmail.transport.js';
import { SmtpTransport } from './transports/smtp.transport.js';
import { MailTransportRegistry } from './transports/transport.registry.js';

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
