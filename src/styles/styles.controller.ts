import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StylesService } from './styles.service';
import { CreateStyleDto } from './dto/create-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';
import { AddBOMItemDto } from './dto/add-bom-item.dto';
import { UpdateBOMItemDto } from './dto/update-bom-item.dto';
import { AddRoutingStepDto } from './dto/add-routing-step.dto';
import { UpdateRoutingStepDto } from './dto/update-routing-step.dto';
import { ReorderRoutingDto } from './dto/reorder-routing.dto';
import { CreateCostEstimationDto } from './dto/create-cost-estimation.dto';
import { UpdateCostEstimationDto } from './dto/update-cost-estimation.dto';
import { ExportStylesDto } from './dto/export-styles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { StyleStatus } from './schemas/style.schema';
import * as multer from 'multer';

const storage = multer.memoryStorage();
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files are allowed') as any, false);
  }
};

@Controller('styles')
@UseGuards(JwtAuthGuard)
export class StylesController {
  constructor(
    private readonly stylesService: StylesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  async create(@Body() createStyleDto: CreateStyleDto) {
    return this.stylesService.create(createStyleDto);
  }

  @Get()
  async findAll(@Query('status') status?: StyleStatus) {
    return this.stylesService.findAll(status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stylesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStyleDto: UpdateStyleDto,
  ) {
    return this.stylesService.update(id, updateStyleDto);
  }

  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('file', {
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const imageUrl = await this.cloudinaryService.uploadImage(file, 'styles');
      return this.stylesService.uploadImage(id, imageUrl);
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  @Post(':id/bom')
  async addBOMItem(
    @Param('id') id: string,
    @Body() addBOMItemDto: AddBOMItemDto,
  ) {
    return this.stylesService.addBOMItem(id, addBOMItemDto);
  }

  @Patch(':id/bom/:bomId')
  async updateBOMItem(
    @Param('id') id: string,
    @Param('bomId') bomId: string,
    @Body() updateBOMItemDto: UpdateBOMItemDto,
  ) {
    return this.stylesService.updateBOMItem(id, bomId, updateBOMItemDto);
  }

  @Delete(':id/bom/:bomId')
  async deleteBOMItem(
    @Param('id') id: string,
    @Param('bomId') bomId: string,
  ) {
    return this.stylesService.deleteBOMItem(id, bomId);
  }

  @Post(':id/routing')
  async addRoutingStep(
    @Param('id') id: string,
    @Body() addRoutingStepDto: AddRoutingStepDto,
  ) {
    return this.stylesService.addRoutingStep(id, addRoutingStepDto);
  }

  @Patch(':id/routing/:stepId')
  async updateRoutingStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() updateRoutingStepDto: UpdateRoutingStepDto,
  ) {
    return this.stylesService.updateRoutingStep(id, stepId, updateRoutingStepDto);
  }

  @Delete(':id/routing/:stepId')
  async deleteRoutingStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ) {
    return this.stylesService.deleteRoutingStep(id, stepId);
  }

  @Post(':id/reorder-routing')
  async reorderRouting(
    @Param('id') id: string,
    @Body() reorderRoutingDto: ReorderRoutingDto,
  ) {
    return this.stylesService.reorderRouting(id, reorderRoutingDto);
  }

  @Post(':id/send-to-accounting')
  async sendToAccounting(@Param('id') id: string) {
    return this.stylesService.sendToAccounting(id);
  }

  @Post(':id/save-draft')
  async saveDraft(@Param('id') id: string) {
    return this.stylesService.saveDraft(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.stylesService.remove(id);
  }

  @Post(':id/cost-estimation')
  async createCostEstimation(
    @Param('id') id: string,
    @Body() createCostEstimationDto: CreateCostEstimationDto,
  ) {
    return this.stylesService.createCostEstimation(id, createCostEstimationDto);
  }

  @Patch(':id/cost-estimation')
  async updateCostEstimation(
    @Param('id') id: string,
    @Body() updateCostEstimationDto: UpdateCostEstimationDto,
  ) {
    return this.stylesService.updateCostEstimation(id, updateCostEstimationDto);
  }

  @Post(':id/submit-cost-estimation')
  async submitCostEstimation(@Param('id') id: string) {
    return this.stylesService.submitCostEstimation(id);
  }

  @Post(':id/approve-cost-estimation')
  async approveCostEstimation(@Param('id') id: string) {
    return this.stylesService.approveCostEstimation(id);
  }

  @Get('export/excel')
  @Post('export/excel')
  async exportExcel(
    @Query() filterDto: ExportStylesDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.stylesService.exportStylesToExcel(filterDto);
      
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Danh_Sach_Mau_${date}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      
      res.send(buffer);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Có lỗi xảy ra khi export Excel: ' + error.message);
    }
  }
}
