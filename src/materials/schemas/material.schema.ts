import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Material extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true, default: 0 })
  costPerUnit: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
