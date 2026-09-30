/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { emailTailwindConfig } from './email-tailwind.config';

const APP_NAME = 'Spotlight';

export interface WelcomeEmailProps {
  /** First name or full name of the person who just joined. */
  name: string;
  signInUrl: string;
  /** Display name of the teammate who invited them, when known. */
  invitedBy?: string;
}

export default function WelcomeEmail({
  name,
  signInUrl,
  invitedBy,
}: WelcomeEmailProps) {
  return (
    <Tailwind config={emailTailwindConfig}>
      <Html lang="en">
        <Head />
        <Preview>Your {APP_NAME} account is ready</Preview>
        <Body className="m-0 bg-page bg-page-wash px-4 py-10 font-sans">
          <Container className="mx-auto max-w-[560px] rounded-card border border-solid border-line bg-surface p-8 shadow-card">
            <Text className="m-0 mb-6 text-[11px] font-bold tracking-[0.16em] text-kicker uppercase">
              {APP_NAME}
            </Text>
            <Heading className="m-0 mb-4 font-display text-2xl leading-8 font-bold text-ink">
              Welcome to {APP_NAME}, {name}
            </Heading>
            <Text className="m-0 mb-4 text-[15px] leading-6 text-ink-soft">
              {invitedBy
                ? `${invitedBy} added you to ${APP_NAME}`
                : `You have been added to ${APP_NAME}`}
              , where your team makes the work that deserves credit visible to
              everyone.
            </Text>
            <Text className="m-0 mb-4 text-[15px] leading-6 text-ink-soft">
              Sign in to complete your profile and see what your coworkers are
              celebrating.
            </Text>
            <Section className="mb-6">
              <Button
                href={signInUrl}
                className="rounded-[8px] bg-lagoon px-5 py-3 text-[15px] font-semibold text-surface no-underline"
              >
                Sign in to {APP_NAME}
              </Button>
            </Section>
            <Text className="m-0 text-[13px] leading-5 break-all text-ink-soft">
              If the button does not work, paste this link into your browser:{' '}
              <Link href={signInUrl} className="text-lagoon underline">
                {signInUrl}
              </Link>
            </Text>
            <Hr className="mt-8 mb-4 border-t border-solid border-t-line" />
            <Section>
              <Text className="m-0 text-center text-[12px] leading-[18px] text-ink-muted italic">
                This message was sent automatically, please do not reply.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
