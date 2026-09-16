import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/users/entities/user.entity';
import { JwtPayloadInterface } from '@/auth/interface/jwt-payload.interface';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(user: User): string {
    const payload: JwtPayloadInterface = {
      email: user.email,
      sub: user.id,
    };
    return this.jwtService.sign(payload);
  }

  createRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
