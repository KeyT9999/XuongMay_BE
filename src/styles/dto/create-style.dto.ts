import { IsString, IsNotEmpty, IsOptional, Matches, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStyleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, { message: 'Code must contain only uppercase letters, numbers, and hyphens' })
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  initialPrice?: number;
}
