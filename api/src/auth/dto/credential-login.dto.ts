import { CredentialDto } from './credential.dto';
import { IsNotEmpty, MinLength } from 'class-validator';

export class CredentialLoginDto extends CredentialDto {
  @IsNotEmpty()
  @MinLength(0)
  declare password: string;
}
