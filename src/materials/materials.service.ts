import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material } from './schemas/material.schema';

export interface MaterialDto {
  id: string;
  name: string;
  unit: string;
  stock: number;
  costPerUnit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  async findAll(): Promise<MaterialDto[]> {
    const materials = await this.materialModel.find().exec();
    return materials.map(material => this.toDto(material));
  }

  async findOne(id: string): Promise<MaterialDto> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    return this.toDto(material);
  }

  async findByIds(ids: string[]): Promise<Material[]> {
    return this.materialModel.find({ _id: { $in: ids } }).exec();
  }

  private toDto(material: Material): MaterialDto {
    return {
      id: material._id.toString(),
      name: material.name,
      unit: material.unit,
      stock: material.stock,
      costPerUnit: material.costPerUnit,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    };
  }
}
