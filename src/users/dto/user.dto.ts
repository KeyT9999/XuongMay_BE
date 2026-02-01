import { IsString, IsNotEmpty, MinLength, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UserDto {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  isActive?: boolean;
}
