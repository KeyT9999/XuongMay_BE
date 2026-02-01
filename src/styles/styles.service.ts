import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Style, StyleStatus } from './schemas/style.schema';
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
import { MaterialsService } from '../materials/materials.service';
import * as ExcelJS from 'exceljs';

export interface StyleDto {
  id: string;
  code: string;
  name: string;
  description: string;
  image: string;
  status: StyleStatus;
  bom: Array<{
    id: string;
    materialId: string;
    quantity: number;
    wasteRate: number;
  }>;
  routing: Array<{
    id: string;
    operation: string;
    minutes: number;
    laborRate: number;
  }>;
  proposedPrice: number;
  estimatedCost: number;
  quantity: number;
  initialPrice: number;
  estimatedMaterialCost?: number;
  estimatedLaborCost?: number;
  accountingProfitMargin?: number;
  accountingFinalPrice?: number;
  adjustedBOM?: Array<{
    id: string;
    materialId: string;
    quantity: number;
    wasteRate: number;
  }>;
  adjustedRouting?: Array<{
    id: string;
    operation: string;
    minutes: number;
    laborRate: number;
  }>;
  accountingNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class StylesService {
  private readonly PROFIT_MARGIN = 1.3; // 30% profit

  constructor(
    @InjectModel(Style.name) private styleModel: Model<Style>,
    private materialsService: MaterialsService,
  ) {}

  async create(createStyleDto: CreateStyleDto): Promise<StyleDto> {
    // Check if code already exists
    const existingStyle = await this.styleModel.findOne({ code: createStyleDto.code }).exec();
    if (existingStyle) {
      throw new ConflictException(`Style with code ${createStyleDto.code} already exists`);
    }

    const style = new this.styleModel({
      ...createStyleDto,
      status: StyleStatus.DRAFT,
      bom: [],
      routing: [],
      proposedPrice: 0,
      estimatedCost: 0,
      quantity: createStyleDto.quantity ?? 0,
      initialPrice: createStyleDto.initialPrice ?? 0,
    });

    const savedStyle = await style.save();
    return this.toDto(savedStyle);
  }

  async findAll(status?: StyleStatus): Promise<StyleDto[]> {
    const query = status ? { status } : {};
    const styles = await this.styleModel.find(query).sort({ createdAt: -1 }).exec();
    return styles.map(style => this.toDto(style));
  }

  async findOne(id: string): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }
    return this.toDto(style);
  }

  async update(id: string, updateStyleDto: UpdateStyleDto): Promise<StyleDto> {
    const style = await this.styleModel.findByIdAndUpdate(
      id,
      updateStyleDto,
      { new: true },
    ).exec();

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    // Recalculate price after update
    const updatedStyle = await this.recalculatePrice(style);
    return this.toDto(updatedStyle);
  }

  async uploadImage(id: string, imageUrl: string): Promise<StyleDto> {
    const style = await this.styleModel.findByIdAndUpdate(
      id,
      { image: imageUrl },
      { new: true },
    ).exec();

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    return this.toDto(style);
  }

  async addBOMItem(id: string, addBOMItemDto: AddBOMItemDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    // Verify material exists
    try {
      await this.materialsService.findOne(addBOMItemDto.materialId);
    } catch (error) {
      throw new BadRequestException(`Material with ID ${addBOMItemDto.materialId} not found`);
    }

    // Add BOM item (Mongoose will auto-generate _id)
    style.bom.push(addBOMItemDto as any);
    const updatedStyle = await this.recalculatePrice(style);
    await updatedStyle.save();

    return this.toDto(updatedStyle);
  }

  async updateBOMItem(id: string, bomId: string, updateBOMItemDto: UpdateBOMItemDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    const bomItem = (style.bom as any).id(bomId);
    if (!bomItem) {
      throw new NotFoundException(`BOM item with ID ${bomId} not found`);
    }

    Object.assign(bomItem, updateBOMItemDto);
    const updatedStyle = await this.recalculatePrice(style);
    await updatedStyle.save();

    return this.toDto(updatedStyle);
  }

  async deleteBOMItem(id: string, bomId: string): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    const bomItem = (style.bom as any).id(bomId);
    if (!bomItem) {
      throw new NotFoundException(`BOM item with ID ${bomId} not found`);
    }

    bomItem.deleteOne();
    const updatedStyle = await this.recalculatePrice(style);
    await updatedStyle.save();

    return this.toDto(updatedStyle);
  }

  async addRoutingStep(id: string, addRoutingStepDto: AddRoutingStepDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    // Add routing step (Mongoose will auto-generate _id)
    style.routing.push(addRoutingStepDto as any);
    const updatedStyle = await this.recalculatePrice(style);
    await updatedStyle.save();

    return this.toDto(updatedStyle);
  }

  async updateRoutingStep(id: string, stepId: string, updateRoutingStepDto: UpdateRoutingStepDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    const routingStep = (style.routing as any).id(stepId);
    if (!routingStep) {
      throw new NotFoundException(`Routing step with ID ${stepId} not found`);
    }

    Object.assign(routingStep, updateRoutingStepDto);
    const updatedStyle = await this.recalculatePrice(style);
    await updatedStyle.save();

    return this.toDto(updatedStyle);
  }

  async deleteRoutingStep(id: string, stepId: string): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    const routingStep = (style.routing as any).id(stepId);
    if (!routingStep) {
      throw new NotFoundException(`Routing step with ID ${stepId} not found`);
    }

    routingStep.deleteOne();
    const updatedStyle = await this.recalculatePrice(style);
    await updatedStyle.save();

    return this.toDto(updatedStyle);
  }

  async reorderRouting(id: string, reorderRoutingDto: ReorderRoutingDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    // Validate all step IDs exist
    const existingStepIds = style.routing.map(step => (step as any)._id.toString());
    const invalidIds = reorderRoutingDto.stepIds.filter(stepId => !existingStepIds.includes(stepId));
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid routing step IDs: ${invalidIds.join(', ')}`);
    }

    // Reorder routing steps
    const reorderedSteps = reorderRoutingDto.stepIds.map(stepId => {
      return style.routing.find(step => (step as any)._id.toString() === stepId);
    }).filter(Boolean);

    style.routing = reorderedSteps as any;
    await style.save();

    return this.toDto(style);
  }

  async sendToAccounting(id: string): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    if (style.status !== StyleStatus.DRAFT) {
      throw new BadRequestException(`Cannot send style to accounting. Current status: ${style.status}`);
    }

    style.status = StyleStatus.SENT_TO_ACCOUNTING;
    await style.save();

    return this.toDto(style);
  }

  async saveDraft(id: string): Promise<StyleDto> {
    const style = await this.styleModel.findByIdAndUpdate(
      id,
      { status: StyleStatus.DRAFT },
      { new: true },
    ).exec();

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    return this.toDto(style);
  }

  async remove(id: string): Promise<{ message: string }> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    // Check if style can be deleted (only DRAFT status can be deleted)
    if (style.status !== StyleStatus.DRAFT) {
      throw new BadRequestException(`Cannot delete style with status ${style.status}. Only DRAFT styles can be deleted.`);
    }

    await this.styleModel.findByIdAndDelete(id).exec();
    return { message: 'Style deleted successfully' };
  }

  async createCostEstimation(id: string, dto: CreateCostEstimationDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    if (style.status !== StyleStatus.SENT_TO_ACCOUNTING && style.status !== StyleStatus.COST_ESTIMATED) {
      throw new BadRequestException(`Cannot create cost estimation. Current status: ${style.status}`);
    }

    // Calculate final price if not provided
    let finalPrice = dto.finalPrice;
    if (!finalPrice && dto.estimatedMaterialCost !== undefined && dto.estimatedLaborCost !== undefined) {
      const materialCost = dto.estimatedMaterialCost || 0;
      const laborCost = dto.estimatedLaborCost || 0;
      const profitMargin = dto.profitMargin || 0;
      finalPrice = Math.ceil((materialCost + laborCost) * (1 + profitMargin / 100));
    }

    // If adjustedBOM is provided, replace the BOM
    if (dto.adjustedBOM !== undefined) {
      style.adjustedBOM = dto.adjustedBOM as any;
    }

    // If adjustedRouting is provided, replace the routing
    if (dto.adjustedRouting !== undefined) {
      style.adjustedRouting = dto.adjustedRouting as any;
    }

    // Update cost estimation fields
    style.estimatedMaterialCost = dto.estimatedMaterialCost ?? style.estimatedMaterialCost ?? 0;
    style.estimatedLaborCost = dto.estimatedLaborCost ?? style.estimatedLaborCost ?? 0;
    style.accountingProfitMargin = dto.profitMargin ?? style.accountingProfitMargin ?? 0;
    style.accountingFinalPrice = finalPrice ?? style.accountingFinalPrice ?? 0;
    style.accountingNotes = dto.notes ?? style.accountingNotes ?? '';

    await style.save();
    return this.toDto(style);
  }

  async updateCostEstimation(id: string, dto: UpdateCostEstimationDto): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    if (style.status !== StyleStatus.SENT_TO_ACCOUNTING && style.status !== StyleStatus.COST_ESTIMATED) {
      throw new BadRequestException(`Cannot update cost estimation. Current status: ${style.status}`);
    }

    // Calculate final price if not provided but material/labor costs are updated
    let finalPrice = dto.finalPrice;
    if (!finalPrice && (dto.estimatedMaterialCost !== undefined || dto.estimatedLaborCost !== undefined)) {
      const materialCost = dto.estimatedMaterialCost ?? style.estimatedMaterialCost ?? 0;
      const laborCost = dto.estimatedLaborCost ?? style.estimatedLaborCost ?? 0;
      const profitMargin = dto.profitMargin ?? style.accountingProfitMargin ?? 0;
      finalPrice = Math.ceil((materialCost + laborCost) * (1 + profitMargin / 100));
    }

    // If adjustedBOM is provided, replace the BOM
    if (dto.adjustedBOM !== undefined) {
      style.adjustedBOM = dto.adjustedBOM as any;
    }

    // If adjustedRouting is provided, replace the routing
    if (dto.adjustedRouting !== undefined) {
      style.adjustedRouting = dto.adjustedRouting as any;
    }

    // Update cost estimation fields
    if (dto.estimatedMaterialCost !== undefined) {
      style.estimatedMaterialCost = dto.estimatedMaterialCost;
    }
    if (dto.estimatedLaborCost !== undefined) {
      style.estimatedLaborCost = dto.estimatedLaborCost;
    }
    if (dto.profitMargin !== undefined) {
      style.accountingProfitMargin = dto.profitMargin;
    }
    if (finalPrice !== undefined) {
      style.accountingFinalPrice = finalPrice;
    }
    if (dto.notes !== undefined) {
      style.accountingNotes = dto.notes;
    }

    await style.save();
    return this.toDto(style);
  }

  async submitCostEstimation(id: string): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    if (style.status !== StyleStatus.SENT_TO_ACCOUNTING && style.status !== StyleStatus.COST_ESTIMATED) {
      throw new BadRequestException(`Cannot submit cost estimation. Current status: ${style.status}`);
    }

    // Validate that cost estimation is complete
    if (!style.accountingFinalPrice && !(style.estimatedMaterialCost && style.estimatedLaborCost && style.accountingProfitMargin)) {
      throw new BadRequestException('Cost estimation must have finalPrice or (estimatedMaterialCost + estimatedLaborCost + profitMargin)');
    }

    style.status = StyleStatus.COST_ESTIMATED;
    await style.save();

    return this.toDto(style);
  }

  async approveCostEstimation(id: string): Promise<StyleDto> {
    const style = await this.styleModel.findById(id).exec();
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    if (style.status !== StyleStatus.COST_ESTIMATED) {
      throw new BadRequestException(`Cannot approve cost estimation. Current status: ${style.status}`);
    }

    style.status = StyleStatus.COST_APPROVED;
    await style.save();

    return this.toDto(style);
  }

  private async recalculatePrice(style: Style): Promise<Style> {
    let materialCost = 0;
    let laborCost = 0;

    // Calculate material cost
    if (style.bom && style.bom.length > 0) {
      const materialIds = style.bom.map(item => item.materialId);
      const materials = await this.materialsService.findByIds(materialIds);
      const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

      materialCost = style.bom.reduce((acc, item) => {
        const material = materialMap.get(item.materialId.toString());
        if (!material) return acc;

        const amount = item.quantity * (1 + item.wasteRate / 100);
        return acc + (amount * material.costPerUnit);
      }, 0);
    }

    // Calculate labor cost
    if (style.routing && style.routing.length > 0) {
      laborCost = style.routing.reduce((acc, step) => {
        return acc + (step.minutes * step.laborRate / 60);
      }, 0);
    }

    const totalCost = materialCost + laborCost;
    const proposedPrice = Math.ceil(totalCost * this.PROFIT_MARGIN);

    style.estimatedCost = totalCost;
    style.proposedPrice = proposedPrice;

    return style;
  }

  async exportStylesToExcel(filterDto: ExportStylesDto): Promise<Buffer> {
    // Build query
    const query: any = {};
    
    if (!filterDto.exportAll) {
      if (filterDto.status && filterDto.status.length > 0) {
        query.status = { $in: filterDto.status };
      }
      if (filterDto.styleIds && filterDto.styleIds.length > 0) {
        query._id = { $in: filterDto.styleIds };
      }
    }

    // Get styles
    const styles = await this.styleModel.find(query).sort({ createdAt: -1 }).exec();
    
    if (styles.length === 0) {
      throw new BadRequestException('Không có dữ liệu để export');
    }

    // Get all materials
    const allMaterials = await this.materialsService.findAll();
    const materialMap = new Map(allMaterials.map(m => [m.id, m]));

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Quan Ly Xuong May ERP';
    workbook.created = new Date();

    // Helper function to format date
    const formatDate = (date: Date | undefined): string => {
      if (!date) return '';
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    // Helper function to format number
    const formatNumber = (num: number | undefined): number => {
      return num || 0;
    };

    // Helper function to get status label
    const getStatusLabel = (status: StyleStatus): string => {
      const labels: Record<StyleStatus, string> = {
        [StyleStatus.DRAFT]: 'Nháp',
        [StyleStatus.SENT_TO_ACCOUNTING]: 'Chờ Duyệt Giá',
        [StyleStatus.COST_ESTIMATED]: 'Đã Dự Trù',
        [StyleStatus.COST_APPROVED]: 'Đã Duyệt Giá',
        [StyleStatus.READY_FOR_PLANNING]: 'Sẵn Sàng SX',
        [StyleStatus.IN_PRODUCTION]: 'Đang Sản Xuất',
        [StyleStatus.DONE]: 'Hoàn Thành',
        [StyleStatus.CANCELLED]: 'Đã Hủy',
      };
      return labels[status] || status;
    };

    // Helper function to style header
    const styleHeader = (row: ExcelJS.Row) => {
      row.font = { name: 'Arial', bold: true, size: 12 };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    };

    // Helper function to style data row
    const styleDataRow = (row: ExcelJS.Row, isEven: boolean) => {
      row.font = { name: 'Arial', size: 11 };
      if (isEven) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
      row.alignment = { vertical: 'middle', wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    };

    // Sheet 1: Tổng Hợp
    const summarySheet = workbook.addWorksheet('Tổng Hợp');
    summarySheet.columns = [
      { header: 'Mã Mẫu', key: 'code', width: 12 },
      { header: 'Tên Sản Phẩm', key: 'name', width: 30 },
      { header: 'Mô Tả', key: 'description', width: 40 },
      { header: 'Trạng Thái', key: 'status', width: 15 },
      { header: 'Giá Đề Xuất', key: 'proposedPrice', width: 18 },
      { header: 'Giá Dự Trù', key: 'accountingFinalPrice', width: 18 },
      { header: 'Số Lượng', key: 'quantity', width: 12 },
      { header: 'Đơn Giá Ban Đầu', key: 'initialPrice', width: 18 },
      { header: 'Ngày Tạo', key: 'createdAt', width: 15 },
    ];

    styles.forEach((style, index) => {
      const row = summarySheet.addRow({
        code: style.code,
        name: style.name,
        description: style.description || '',
        status: getStatusLabel(style.status),
        proposedPrice: formatNumber(style.proposedPrice),
        accountingFinalPrice: formatNumber(style.accountingFinalPrice || style.proposedPrice),
        quantity: formatNumber(style.quantity),
        initialPrice: formatNumber(style.initialPrice),
        createdAt: formatDate(style.createdAt),
      });
      styleDataRow(row, index % 2 === 1);
      
      // Format number columns
      const priceCol = row.getCell('proposedPrice');
      priceCol.numFmt = '#,##0';
      const finalPriceCol = row.getCell('accountingFinalPrice');
      finalPriceCol.numFmt = '#,##0';
      const initialPriceCol = row.getCell('initialPrice');
      initialPriceCol.numFmt = '#,##0';
    });

    styleHeader(summarySheet.getRow(1));
    summarySheet.getRow(1).height = 25;

    // Sheet 2: Chi Tiết BOM
    if (filterDto.includeBOM !== false) {
      const bomSheet = workbook.addWorksheet('Chi Tiết BOM');
      bomSheet.columns = [
        { header: 'Mã Mẫu', key: 'code', width: 12 },
        { header: 'Tên Mẫu', key: 'styleName', width: 30 },
        { header: 'Vật Tư', key: 'materialName', width: 30 },
        { header: 'Đơn Vị', key: 'unit', width: 10 },
        { header: 'Số Lượng', key: 'quantity', width: 12 },
        { header: 'Hao Hụt (%)', key: 'wasteRate', width: 12 },
        { header: 'Đơn Giá', key: 'costPerUnit', width: 18 },
        { header: 'Thành Tiền', key: 'total', width: 18 },
      ];

      let bomRowIndex = 0;
      styles.forEach((style) => {
        if (style.bom && style.bom.length > 0) {
          style.bom.forEach((item) => {
            const material = materialMap.get(item.materialId.toString());
            const amount = item.quantity * (1 + item.wasteRate / 100);
            const total = amount * (material?.costPerUnit || 0);
            
            const row = bomSheet.addRow({
              code: style.code,
              styleName: style.name,
              materialName: material?.name || item.materialId.toString(),
              unit: material?.unit || '',
              quantity: item.quantity,
              wasteRate: item.wasteRate,
              costPerUnit: material?.costPerUnit || 0,
              total: total,
            });
            styleDataRow(row, bomRowIndex % 2 === 1);
            
            const costCol = row.getCell('costPerUnit');
            costCol.numFmt = '#,##0';
            const totalCol = row.getCell('total');
            totalCol.numFmt = '#,##0';
            
            bomRowIndex++;
          });
        }
      });

      if (bomRowIndex > 0) {
        styleHeader(bomSheet.getRow(1));
        bomSheet.getRow(1).height = 25;
      }
    }

    // Sheet 3: Chi Tiết Routing
    if (filterDto.includeRouting !== false) {
      const routingSheet = workbook.addWorksheet('Chi Tiết Routing');
      routingSheet.columns = [
        { header: 'Mã Mẫu', key: 'code', width: 12 },
        { header: 'Tên Mẫu', key: 'styleName', width: 30 },
        { header: 'Công Đoạn', key: 'operation', width: 30 },
        { header: 'Phút', key: 'minutes', width: 10 },
        { header: 'Rate (đ/giờ)', key: 'laborRate', width: 18 },
        { header: 'Thành Tiền', key: 'total', width: 18 },
      ];

      let routingRowIndex = 0;
      styles.forEach((style) => {
        if (style.routing && style.routing.length > 0) {
          style.routing.forEach((step) => {
            const total = (step.minutes * step.laborRate) / 60;
            
            const row = routingSheet.addRow({
              code: style.code,
              styleName: style.name,
              operation: step.operation,
              minutes: step.minutes,
              laborRate: step.laborRate,
              total: total,
            });
            styleDataRow(row, routingRowIndex % 2 === 1);
            
            const rateCol = row.getCell('laborRate');
            rateCol.numFmt = '#,##0';
            const totalCol = row.getCell('total');
            totalCol.numFmt = '#,##0';
            
            routingRowIndex++;
          });
        }
      });

      if (routingRowIndex > 0) {
        styleHeader(routingSheet.getRow(1));
        routingSheet.getRow(1).height = 25;
      }
    }

    // Sheet 4: Dự Trù Chi Phí
    if (filterDto.includeCostEstimation !== false) {
      const costSheet = workbook.addWorksheet('Dự Trù Chi Phí');
      costSheet.columns = [
        { header: 'Mã Mẫu', key: 'code', width: 12 },
        { header: 'Tên Mẫu', key: 'styleName', width: 30 },
        { header: 'Giá Vật Tư', key: 'estimatedMaterialCost', width: 18 },
        { header: 'Giá Công', key: 'estimatedLaborCost', width: 18 },
        { header: 'Lợi Nhuận (%)', key: 'profitMargin', width: 15 },
        { header: 'Giá Cuối Cùng', key: 'finalPrice', width: 18 },
        { header: 'Ghi Chú', key: 'notes', width: 40 },
      ];

      let costRowIndex = 0;
      styles.forEach((style) => {
        if (style.accountingFinalPrice || style.estimatedMaterialCost || style.estimatedLaborCost) {
          const row = costSheet.addRow({
            code: style.code,
            styleName: style.name,
            estimatedMaterialCost: formatNumber(style.estimatedMaterialCost),
            estimatedLaborCost: formatNumber(style.estimatedLaborCost),
            profitMargin: formatNumber(style.accountingProfitMargin),
            finalPrice: formatNumber(style.accountingFinalPrice || style.proposedPrice),
            notes: style.accountingNotes || '',
          });
          styleDataRow(row, costRowIndex % 2 === 1);
          
          const materialCol = row.getCell('estimatedMaterialCost');
          materialCol.numFmt = '#,##0';
          const laborCol = row.getCell('estimatedLaborCost');
          laborCol.numFmt = '#,##0';
          const finalCol = row.getCell('finalPrice');
          finalCol.numFmt = '#,##0';
          
          costRowIndex++;
        }
      });

      if (costRowIndex > 0) {
        styleHeader(costSheet.getRow(1));
        costSheet.getRow(1).height = 25;
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private toDto(style: Style): StyleDto {
    return {
      id: style._id.toString(),
      code: style.code,
      name: style.name,
      description: style.description,
      image: style.image,
      status: style.status,
      bom: style.bom.map(item => ({
        id: (item as any)._id.toString(),
        materialId: item.materialId.toString(),
        quantity: item.quantity,
        wasteRate: item.wasteRate,
      })),
      routing: style.routing.map(step => ({
        id: (step as any)._id.toString(),
        operation: step.operation,
        minutes: step.minutes,
        laborRate: step.laborRate,
      })),
      proposedPrice: style.proposedPrice,
      estimatedCost: style.estimatedCost,
      quantity: style.quantity,
      initialPrice: style.initialPrice,
      estimatedMaterialCost: style.estimatedMaterialCost,
      estimatedLaborCost: style.estimatedLaborCost,
      accountingProfitMargin: style.accountingProfitMargin,
      accountingFinalPrice: style.accountingFinalPrice,
      adjustedBOM: style.adjustedBOM?.map(item => ({
        id: (item as any)._id?.toString() || '',
        materialId: item.materialId.toString(),
        quantity: item.quantity,
        wasteRate: item.wasteRate,
      })),
      adjustedRouting: style.adjustedRouting?.map(step => ({
        id: (step as any)._id?.toString() || '',
        operation: step.operation,
        minutes: step.minutes,
        laborRate: step.laborRate,
      })),
      accountingNotes: style.accountingNotes,
      createdAt: style.createdAt,
      updatedAt: style.updatedAt,
    };
  }
}
