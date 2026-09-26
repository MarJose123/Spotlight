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
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { PaginationMetaDto } from '@/common/dto/pagination/pagination-meta.dto';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import { PostLikeResponseDto } from '@/common/dto/post-like-response.dto';
import { PostResponseDto } from '@/posts/dto/post-response.dto';
import { CreatePostDto } from '@/posts/dto/create-post.dto';
import { LikePostByIdDto, LikePostDto } from '@/posts/dto/like-post.dto';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import { CredentialDto } from '@/auth/dto/credential.dto';
import { CredentialLoginDto } from '@/auth/dto/credential-login.dto';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { GeneratePresignedUrlDto } from '@/bucket/dto/generate-presigned-url.dto';
import { PresignedUrlResponseDto } from '@/bucket/dto/presigned-url-response.dto';

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
    .addTag('Auth', 'Authentication and token lifecycle.')
    .addTag('Users', 'User accounts and profiles.')
    .addTag('Posts', 'Recognition posts, likes and attachments.')
    .addTag('Health', 'Service and dependency health.')
    .addGlobalResponse({
      status: 400,
      description: 'Bad request.',
      type: ErrorResponseDto,
    })
    .addGlobalResponse({
      status: 500,
      description: 'Internal server error.',
      type: ErrorResponseDto,
    })
    .build();

  /**
   * Every DTO referenced by a controller is registered automatically, but the
   * extra models below are listed explicitly so that the request/response
   * contracts also appear in the "Models" section of the documentation even
   * when they are only reachable through a generic or composed schema.
   */
  const extraModels = [
    ErrorResponseDto,
    PaginationMetaDto,
    PaginationQueryDto,
    PaginationResponseDto,
    PostLikeResponseDto,
    PostResponseDto,
    CreatePostDto,
    LikePostDto,
    LikePostByIdDto,
    UserResponseDto,
    CreateUserDto,
    UpdateUserDto,
    AuthenticatedUserDto,
    CredentialDto,
    CredentialLoginDto,
    JwtTokenResponse,
    RefreshTokenDto,
    GeneratePresignedUrlDto,
    PresignedUrlResponseDto,
  ];

  const openApiDocumentFactory = () =>
    SwaggerModule.createDocument(app, configOpenApi, { extraModels });

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
      persistAuth: true,
      orderSchemaPropertiesBy: 'preserve',
      setPageTitle: ({ document }) => `${document.title}`,
    }),
  );

  /**
   * Raw OpenAPI document, so code generators and other OpenAPI tooling can
   * consume the same schema that backs the human-readable reference above.
   */
  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/openapi.json', (_request, reply) => {
    void reply.send(openApiDocumentFactory());
  });

  /**
   * Start the application
   */
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
void bootstrap();
