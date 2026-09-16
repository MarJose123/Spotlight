import { User } from '@/users/entities/user.entity';

export class JwtTokenDto {
  user: any;
  access_token!: string;
  refresh_token!: string;
  expires_in: number;
  token_type: string = 'Bearer';

  constructor(
    user: User,
    access_token: string,
    refresh_token: string,
    expires_in: number = 300,
  ) {
    this.user = user;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.expires_in = expires_in;
  }
}
