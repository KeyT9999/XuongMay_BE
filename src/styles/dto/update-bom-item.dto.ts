import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBOMItemDto {
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  wasteRate?: number;
}
