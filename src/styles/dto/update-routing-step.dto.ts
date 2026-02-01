import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateRoutingStepDto {
  @IsString()
  @IsOptional()
  operation?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  minutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  laborRate?: number;
}
