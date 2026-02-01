import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: true })
export class BOMItem {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Material' })
  materialId: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0, default: 0 })
  wasteRate: number;
}

export const BOMItemSchema = SchemaFactory.createForClass(BOMItem);
