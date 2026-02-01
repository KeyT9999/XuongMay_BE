import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  TECH = 'TECH',
  ACCOUNTANT = 'ACCOUNTANT',
  PLANNER = 'PLANNER',
  WAREHOUSE = 'WAREHOUSE',
  HR = 'HR',
  FACTORY_MANAGER = 'FACTORY_MANAGER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
