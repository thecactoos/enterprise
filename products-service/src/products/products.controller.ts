import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSearchDto, DimensionSearchDto } from './dto/product-search.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: Product,
  })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return await this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with optional search filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
    type: [Product],
  })
  async findAll(@Query() searchDto: ProductSearchDto): Promise<Product[]> {
    return await this.productsService.findAll(searchDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStats() {
    return await this.productsService.getStats();
  }

  @Get('search/dimensions')
  @ApiOperation({ summary: 'Search products by dimensions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products filtered by dimensions',
    type: [Product],
  })
  async searchByDimensions(@Query() dimensionDto: DimensionSearchDto): Promise<Product[]> {
    return await this.productsService.searchByDimensions(
      dimensionDto.minThickness,
      dimensionDto.maxThickness,
      dimensionDto.minWidth,
      dimensionDto.maxWidth,
      dimensionDto.minLength,
      dimensionDto.maxLength,
    );
  }

  @Get('code/:productCode')
  @ApiOperation({ summary: 'Get product by product code' })
  @ApiParam({ name: 'productCode', description: 'Product code', example: '54045' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product found',
    type: Product,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async findByCode(@Param('productCode') productCode: string): Promise<Product> {
    return await this.productsService.findByCode(productCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by UUID' })
  @ApiParam({ name: 'id', description: 'Product UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product found',
    type: Product,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return await this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return await this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.productsService.remove(id);
  }
}