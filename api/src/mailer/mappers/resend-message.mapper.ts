/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { Attachment } from 'resend';
import { MailAttachment } from '#/mailer/interface/mail-transport.interface.js';

export const ResendMessageMapper = {
  /**
   * Resend carries in-memory attachments as base64 in the request body, and
   * names the inline-image id `contentId` where nodemailer calls it `cid`.
   */
  toAttachments(attachments?: MailAttachment[]): Attachment[] | undefined {
    return attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content?.toString('base64'),
      contentType: attachment.contentType,
      path: attachment.path,
      contentId: attachment.cid,
    }));
  },
};
