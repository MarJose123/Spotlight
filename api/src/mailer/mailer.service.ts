/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createElement } from 'react';
import { render } from 'react-email';
import { MailConfig, MailTransportName } from '#/config/mail.config.js';
import {
  MailDeliveryResult,
  MailRecipient,
} from '#/mailer/interface/mail-transport.interface.js';
import { SendMailOptions } from '#/mailer/interface/send-mail-options.interface.js';
import { MailAddressMapper } from '#/mailer/mappers/mail-address.mapper.js';
import { MailTransportRegistry } from '#/mailer/transports/transport.registry.js';

@Injectable()
export class MailerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly registry: MailTransportRegistry,
  ) {}

  /**
   * Renders a React Email template and hands the result to the transport
   * `MAIL_MAILER` selects, or to the one the message asks for.
   */
  async send<TProps extends object>(
    options: SendMailOptions<TProps>,
  ): Promise<MailDeliveryResult> {
    const transport = this.resolveTransport(options.mailer);
    const element = createElement(options.template, options.props);

    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    return transport.send({
      from: this.resolveFrom(options.from),
      to: MailAddressMapper.toMailboxes(options.to),
      cc: this.resolveOptional(options.cc),
      bcc: this.resolveOptional(options.bcc),
      replyTo: this.resolveOptional(options.replyTo),
      subject: options.subject,
      html,
      text,
      headers: options.headers,
      attachments: options.attachments,
    });
  }

  private resolveTransport(name?: MailTransportName) {
    if (!name) {
      return this.registry.default;
    }

    const transport = this.registry.get(name);

    if (!transport) {
      throw new Error(
        `Mailer "${name}" is not registered. Known mailers: smtp, sendmail, resend.`,
      );
    }

    return transport;
  }

  private resolveFrom(from?: MailRecipient): string {
    if (from) {
      return MailAddressMapper.toMailbox(from);
    }

    const { address, name } =
      this.configService.getOrThrow<MailConfig['from']>('mail.from');

    return MailAddressMapper.toMailbox({ address, name });
  }

  private resolveOptional(
    recipients?: MailRecipient | MailRecipient[],
  ): string[] | undefined {
    return recipients ? MailAddressMapper.toMailboxes(recipients) : undefined;
  }
}
