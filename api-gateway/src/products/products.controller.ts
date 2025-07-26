import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return await this.productsService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return await this.productsService.getStats();
  }

  @Get('search/dimensions')
  async searchByDimensions(@Query() query: any) {
    return await this.productsService.searchByDimensions(query);
  }

  @Get('code/:productCode')
  async findByCode(@Param('productCode') productCode: string) {
    return await this.productsService.findByCode(productCode);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productsService.findOne(id);
  }
}