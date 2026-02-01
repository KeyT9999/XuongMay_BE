import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BOMItem, BOMItemSchema } from './bom-item.schema';
import { RoutingStep, RoutingStepSchema } from './routing-step.schema';

export enum StyleStatus {
  DRAFT = 'DRAFT',
  SENT_TO_ACCOUNTING = 'SENT_TO_ACCOUNTING',
  COST_ESTIMATED = 'COST_ESTIMATED',
  COST_APPROVED = 'COST_APPROVED',
  READY_FOR_PLANNING = 'READY_FOR_PLANNING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Style extends Document {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ required: true, enum: StyleStatus, default: StyleStatus.DRAFT })
  status: StyleStatus;

  @Prop({ type: [BOMItemSchema], default: [] })
  bom: BOMItem[];

  @Prop({ type: [RoutingStepSchema], default: [] })
  routing: RoutingStep[];

  @Prop({ default: 0 })
  proposedPrice: number;

  @Prop({ default: 0 })
  estimatedCost: number;

  @Prop({ default: 0, min: 0 })
  quantity: number;

  @Prop({ default: 0, min: 0 })
  initialPrice: number;

  // Cost Estimation fields
  @Prop({ default: 0 })
  estimatedMaterialCost: number;

  @Prop({ default: 0 })
  estimatedLaborCost: number;

  @Prop({ default: 0, min: 0 })
  accountingProfitMargin: number;

  @Prop({ default: 0 })
  accountingFinalPrice: number;

  @Prop({ type: [BOMItemSchema], default: [] })
  adjustedBOM: BOMItem[];

  @Prop({ type: [RoutingStepSchema], default: [] })
  adjustedRouting: RoutingStep[];

  @Prop({ default: '' })
  accountingNotes: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StyleSchema = SchemaFactory.createForClass(Style);
