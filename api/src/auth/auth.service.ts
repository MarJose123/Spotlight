import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@/users/entities/user.entity';
import bcrypt from 'bcrypt';
import { CredentialDto } from './dto/credential.dto';
import { JwtTokenDto } from './dto/jwt-token.dto';
import { EntityManager } from '@mikro-orm/core';
import { TokenService } from './token.service';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private readonly em: EntityManager,
  ) {}

  /** Validates the user email and returns true if it exists. */
  async validateUserEmail(email: string): Promise<User | null> {
    const user = await this.em.findOne(User, { email });
    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * Logs in a user by email and password.
   */
  async authenticate(cred: CredentialDto): Promise<JwtTokenDto> {
    const user = await this.em.findOne(User, { email: cred.email });
    if (
      !user ||
      !(user.password && (await bcrypt.compare(cred.password, user.password)))
    ) {
      throw new UnauthorizedException({
        message: 'These credentials do not match our records.',
      });
    }

    const token = this.tokenService.createAccessToken(user);
    const refreshToken = this.tokenService.createRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);

    const refreshTokenModel = new RefreshToken();
    Object.assign(refreshTokenModel, {
      userId: user.id,
      tokenHash,
      expiresAt: this.getRefreshTokenExpiration(),
    });

    this.em.persist(refreshTokenModel);
    await this.em.flush();

    return new JwtTokenDto(user, token, refreshToken, 300);
  }

  /**
   * Refreshes the access token using the refresh token.
   */
  async refresh(token: string) {
    const tokenHash = this.tokenService.hashRefreshToken(token);
    const storedToken = await this.em.findOne(RefreshToken, { tokenHash });
    if (!storedToken)
      throw new UnauthorizedException({ message: 'Invalid refresh token' });
    if (storedToken.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException({ message: 'Refresh token expired' });
    if (storedToken.revokedAt)
      throw new UnauthorizedException({ message: 'Refresh token revoked' });

    const user = await this.em.findOne(User, { id: storedToken.userId });
    if (!user)
      throw new UnauthorizedException({
        message: 'Invalid authenticated user',
      });

    const newAccessToken = this.tokenService.createAccessToken(user);

    return new JwtTokenDto(user, newAccessToken, token);
  }

  /**
   * Logs out the user by revoking the refresh token.
   */
  async logout(refreshToken: string) {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.em.findOne(RefreshToken, { tokenHash });
    if (!storedToken) return;

    storedToken.revokedAt = new Date();
    await this.em.flush();
  }

  /**
   * Returns the expiration date for the refresh token.
   */
  private getRefreshTokenExpiration(): Date {
    // 24 hours
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}
