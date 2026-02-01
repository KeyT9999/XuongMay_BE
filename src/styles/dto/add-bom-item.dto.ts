import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddBOMItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  wasteRate: number;
}
