import { IsNumber, IsOptional, Min, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddBOMItemDto } from './add-bom-item.dto';
import { AddRoutingStepDto } from './add-routing-step.dto';

export class UpdateCostEstimationDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  estimatedMaterialCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  estimatedLaborCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  profitMargin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  finalPrice?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddBOMItemDto)
  @IsOptional()
  adjustedBOM?: AddBOMItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddRoutingStepDto)
  @IsOptional()
  adjustedRouting?: AddRoutingStepDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
