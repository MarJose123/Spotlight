/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { ComponentType } from 'react';
import { MailTransportName } from '@/config/mail.config';
import {
  MailAttachment,
  MailRecipient,
} from '@/mailer/interface/mail-transport.interface';

export interface SendMailOptions<
  TProps extends object = Record<string, never>,
> {
  /** React Email template rendered into the HTML and plain text bodies. */
  template: ComponentType<TProps>;
  props: TProps;
  to: MailRecipient | MailRecipient[];
  subject: string;
  /** Overrides the `MAIL_MAILER` transport for this message only. */
  mailer?: MailTransportName;
  /** Overrides the global "From" address. */
  from?: MailRecipient;
  cc?: MailRecipient | MailRecipient[];
  bcc?: MailRecipient | MailRecipient[];
  replyTo?: MailRecipient | MailRecipient[];
  headers?: Record<string, string>;
  attachments?: MailAttachment[];
}
