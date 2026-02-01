import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StylesController } from './styles.controller';
import { StylesService } from './styles.service';
import { Style, StyleSchema } from './schemas/style.schema';
import { MaterialsModule } from '../materials/materials.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Style.name, schema: StyleSchema }]),
    MaterialsModule,
    CloudinaryModule,
  ],
  controllers: [StylesController],
  providers: [StylesService],
  exports: [StylesService],
})
export class StylesModule {}
