import { IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StyleStatus } from '../schemas/style.schema';

export class ExportStylesDto {
  @IsOptional()
  @IsArray()
  @IsEnum(StyleStatus, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim());
    }
    return Array.isArray(value) ? value : [value];
  })
  status?: StyleStatus[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim());
    }
    return Array.isArray(value) ? value : [value];
  })
  styleIds?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeBOM?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRouting?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCostEstimation?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  exportAll?: boolean;
}
