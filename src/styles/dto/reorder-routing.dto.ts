import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderRoutingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  stepIds: string[];
}
