import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination/pagination-query.dto';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Posts } from './entities/posts.entity';
import { PaginationResponseDto } from '../common/dto/pagination/pagination-response.dto';
import { LikePostDto } from './dto/like-post.dto';
import { minutes, seconds, Throttle } from '@nestjs/throttler';

@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({
    summary: 'Get all post',
    description: 'Get all post',
  })
  @ApiOkResponse({
    description: 'success',
    type: PaginationResponseDto<Posts>,
  })
  @Get()
  @UseGuards(JwtAuthGuard)
  async getPosts(@Query() paginationQuery: PaginationQueryDto) {
    return this.postsService.findAll(paginationQuery);
  }

  @ApiOperation({
    summary: 'Get post by user id',
    description: 'Get post by user id',
  })
  @ApiOkResponse({
    description: 'success',
    type: PaginationResponseDto<Posts>,
  })
  @Get('/user/:id')
  @UseGuards(JwtAuthGuard)
  async getPostsByUser(
    @Query() paginationQuery: PaginationQueryDto,
    @Param('id') id: string,
  ) {
    return this.postsService.findByUserId({ paginationQuery, userId: id });
  }

  @ApiOperation({
    summary: 'Create post',
    description: 'Create post',
  })
  @ApiOkResponse({
    description: 'success',
    type: Posts,
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @ApiOperation({
    summary: 'Like post',
    description: 'Like post',
  })
  @ApiOkResponse({
    description: 'success',
    type: Posts,
  })
  @Put('/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  async likePost(@Body() dto: LikePostDto) {
    return await this.postsService.likePost(dto);
  }

  @ApiOperation({
    summary: 'Like post by id',
    description: 'Like post by id',
  })
  @ApiOkResponse({
    description: 'success',
    type: Posts,
  })
  @Post('/:id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  async likePostById(@Param('id') id: string, @Body('user') user: string) {
    return await this.postsService.likePost({ post: id, user });
  }
}
