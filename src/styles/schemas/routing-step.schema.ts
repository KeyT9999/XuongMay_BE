import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: true })
export class RoutingStep {
  @Prop({ required: true })
  operation: string;

  @Prop({ required: true, min: 0 })
  minutes: number;

  @Prop({ required: true, min: 0 })
  laborRate: number;
}

export const RoutingStepSchema = SchemaFactory.createForClass(RoutingStep);
