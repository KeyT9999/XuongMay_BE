import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddRoutingStepDto {
  @IsString()
  @IsNotEmpty()
  operation: string;

  @IsNumber()
  @Min(0.01)
  minutes: number;

  @IsNumber()
  @Min(0.01)
  laborRate: number;
}
