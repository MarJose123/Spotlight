/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { SendMailOptions } from 'nodemailer';
import { MailTransportName } from '#/config/mail.config.js';
import {
  MailDeliveryResult,
  MailMessage,
} from '#/mailer/interface/mail-transport.interface.js';

/**
 * Structural stand-in for the `SentMessageInfo` of nodemailer's SMTP and
 * sendmail transports, which report the same envelope outcome.
 */
export interface NodemailerDeliveryInfo {
  messageId: string;
  accepted?: Array<string | { address: string }>;
  rejected?: Array<string | { address: string }>;
  response?: string;
}

function toAddress(recipient: string | { address: string }): string {
  return typeof recipient === 'string' ? recipient : recipient.address;
}

export const NodemailerMessageMapper = {
  toSendMailOptions(message: MailMessage): SendMailOptions {
    return {
      from: message.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.headers,
      attachments: message.attachments,
    };
  },

  toDeliveryResult(
    transport: MailTransportName,
    info: NodemailerDeliveryInfo,
  ): MailDeliveryResult {
    return {
      transport,
      messageId: info.messageId,
      accepted: info.accepted?.map(toAddress),
      rejected: info.rejected?.map(toAddress),
      response: info.response,
    };
  },
};
