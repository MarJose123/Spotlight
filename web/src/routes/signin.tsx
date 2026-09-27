/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import {
  Alert,
  Button,
  Divider,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { createFileRoute } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { ProviderButton } from '../components/auth/ProviderButton'
import { fetchEnabledProviders } from '../lib/api'
import { type SignInValues, signInSchema } from '../lib/schemas/auth'

export const Route = createFileRoute('/signin')({
  loader: () => fetchEnabledProviders(),
  head: () => ({
    meta: [{ title: 'Sign in · Spotlight' }],
  }),
  component: SignIn,
})

function SignIn() {
  const { ids, reachable } = Route.useLoaderData()
  const hasSso = ids.length > 0

  const form = useForm<SignInValues>({
    initialValues: {
      email: '',
      password: '',
    },

    validate: zod4Resolver(signInSchema),
  })

  return (
    <main className="page-wrap px-4 py-16">
      <section className="mx-auto w-full max-w-md">
        <Stack align="center" gap="xs" mb="lg">
          <Text className="island-kicker">Internal recognition</Text>
          <Title order={1} fz={{ base: 40, sm: 56 }}>
            Spotlight
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Celebrate great work. Recognize your teammates.
          </Text>
        </Stack>

        <Paper radius="lg" p="lg" withBorder className="rise-in">
          <Stack gap="lg">
            <div>
              <Text size="lg" fw={500} c="bright">
                {hasSso
                  ? 'Welcome to Spotlight, sign in with'
                  : 'Sign in to Spotlight'}
              </Text>

              {hasSso && (
                // A row would squeeze long provider names into ellipses.
                <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs" mt="md">
                  {ids.map((provider) => (
                    <ProviderButton key={provider} provider={provider} />
                  ))}
                </SimpleGrid>
              )}
            </div>

            {hasSso && (
              <Divider label="Or continue with email" labelPosition="center" />
            )}

            {!reachable && (
              <Alert
                color="yellow"
                variant="light"
                icon={<TriangleAlert size={16} aria-hidden="true" />}
              >
                Single sign-on providers could not be loaded. Refresh the page to
                try again.
              </Alert>
            )}

            <form onSubmit={form.onSubmit(() => {})}>
              <Stack>
                <TextInput
                  withAsterisk
                  label="Email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  radius="md"
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  withAsterisk
                  label="Password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  radius="md"
                  {...form.getInputProps('password')}
                />
              </Stack>

              <Group justify="space-between" align="center" mt="xl" gap="sm">
                <Text size="xs" c="dimmed">
                  Accounts are provisioned by an administrator.
                </Text>
                <Button type="submit" radius="xl">
                  Sign in
                </Button>
              </Group>
            </form>
          </Stack>
        </Paper>
      </section>
    </main>
  )
}
