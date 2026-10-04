/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { MailTransportName } from '#/config/mail.config.js';

export interface MailAddress {
  address: string;
  name?: string;
}

export type MailRecipient = string | MailAddress;

export interface MailAttachment {
  filename: string;
  /** Attach a file already held in memory. Resend receives it base64 encoded. */
  content?: Buffer;
  contentType?: string;
  /** Attach a file by path, read by the machine that performs the sending. */
  path?: string;
  /** Content id of an inline image, referenced in the HTML as `cid:<value>`. */
  cid?: string;
}

/**
 * Fully rendered message handed to a transport. Addresses are already formatted
 * as `Name <address>`, so a transport only has to know how to deliver it.
 */
export interface MailMessage {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  headers?: Record<string, string>;
  attachments?: MailAttachment[];
}

export interface MailDeliveryResult {
  transport: MailTransportName;
  messageId: string;
  /**
   * Recipients the server took on, and the ones it refused. Resend only reports
   * the id of the accepted send, so both lists stay empty for that transport.
   */
  accepted?: string[];
  rejected?: string[];
  response?: string;
}

export interface MailTransport {
  readonly name: MailTransportName;
  send(message: MailMessage): Promise<MailDeliveryResult>;
}
