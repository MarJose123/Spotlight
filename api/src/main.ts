/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from '@fastify/helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const orm = app.get(MikroORM);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableShutdownHooks();
  await app.register(helmet);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.reduce(
          (acc, error) => {
            acc[error.property] = Object.values(error.constraints ?? {});
            return acc;
          },
          {} as Record<string, string[]>,
        );

        return new BadRequestException({
          message: messages,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );
  // In development only, make sure the database exists and the schema is up to
  // date (a missing SQLite database file is created programmatically in
  // `src/config/mikro-orm.config.ts`). Production should rely on migrations.
  if ((process.env.NODE_ENV ?? 'development') === 'development') {
    await orm.schema.ensureDatabase();
    await orm.schema.update();
  }

  /**
   * Swagger UI documentation
   */

  const configOpenApi = new DocumentBuilder()
    .setTitle('Spotlight API')
    .setDescription(
      'Spotlight is an internal recognition tool that helps teams celebrate and appreciate their coworkers. Employees can easily post commendations, give shout-outs, and recognize great work, helping foster a positive culture of appreciation and making achievements visible across the organization.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalResponse({
      status: 500,
      description: 'Internal server error',
    })
    .addGlobalResponse({
      status: 400,
      description: 'Bad request',
    })
    .build();

  const openApiDocumentFactory = () =>
    SwaggerModule.createDocument(app, configOpenApi);

  app.use(
    '/docs',
    apiReference({
      content: openApiDocumentFactory,
      withFastify: true,
      theme: 'default',
      hideModels: true,
      mcp: { disabled: true },
      agent: { disabled: true },
      telemetry: false,
      hideClientButton: true,
      documentDownloadType: 'none',
      setPageTitle: ({ document }) => `${document.title}`,
    }),
  );

  /**
   * Start the application
   */

  // Bind to all interfaces so the containerised dev stack (compose.dev.yaml)
  // is reachable through its published ports; Fastify would otherwise default
  // to `localhost` and only accept connections from inside the container.
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
void bootstrap();
