import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string; // Can be username or email

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
