/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { MailRecipient } from '@/mailer/interface/mail-transport.interface';

const UNSAFE_DISPLAY_NAME = /[^A-Za-z0-9 ]/;

export const MailAddressMapper = {
  /**
   * Formats a recipient as `Name <address>`. The display name is quoted when it
   * holds anything outside an RFC 5322 atom, such as the comma in "Doe, John",
   * because nodemailer would otherwise split the header into two recipients.
   */
  toMailbox(recipient: MailRecipient): string {
    if (typeof recipient === 'string') {
      return recipient;
    }

    if (!recipient.name) {
      return recipient.address;
    }

    const name = UNSAFE_DISPLAY_NAME.test(recipient.name)
      ? `"${recipient.name.replaceAll('"', '\\"')}"`
      : recipient.name;

    return `${name} <${recipient.address}>`;
  },

  toMailboxes(recipients: MailRecipient | MailRecipient[]): string[] {
    return (Array.isArray(recipients) ? recipients : [recipients]).map(
      (recipient) => MailAddressMapper.toMailbox(recipient),
    );
  },
};
