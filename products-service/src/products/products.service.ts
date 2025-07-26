import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Product, ProductStatus } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSearchDto } from './dto/product-search.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(searchDto?: ProductSearchDto): Promise<Product[]> {
    const options: FindManyOptions<Product> = {
      where: {},
      order: { product_name: 'ASC' },
    };

    if (searchDto) {
      if (searchDto.search) {
        options.where = [
          { product_name: Like(`%${searchDto.search}%`) },
          { product_code: Like(`%${searchDto.search}%`) },
          { unofficial_product_name: Like(`%${searchDto.search}%`) },
        ];
      }

      if (searchDto.status) {
        options.where = { ...options.where, status: searchDto.status };
      }

      if (searchDto.isActive !== undefined) {
        options.where = { ...options.where, is_active: searchDto.isActive };
      }

      // Price filtering will be handled with query builder for complex conditions
      if (searchDto.minPrice || searchDto.maxPrice) {
        const queryBuilder = this.productRepository.createQueryBuilder('product');
        
        if (searchDto.search) {
          queryBuilder.where(
            '(product.product_name ILIKE :search OR product.product_code ILIKE :search OR product.unofficial_product_name ILIKE :search)',
            { search: `%${searchDto.search}%` }
          );
        }
        
        if (searchDto.status) {
          queryBuilder.andWhere('product.status = :status', { status: searchDto.status });
        }
        
        if (searchDto.isActive !== undefined) {
          queryBuilder.andWhere('product.is_active = :isActive', { isActive: searchDto.isActive });
        }
        
        if (searchDto.minPrice) {
          queryBuilder.andWhere('product.selling_price_per_unit >= :minPrice', { minPrice: searchDto.minPrice });
        }
        
        if (searchDto.maxPrice) {
          queryBuilder.andWhere('product.selling_price_per_unit <= :maxPrice', { maxPrice: searchDto.maxPrice });
        }
        
        queryBuilder.orderBy('product.product_name', 'ASC');
        
        if (searchDto.limit) {
          queryBuilder.take(searchDto.limit);
        }
        
        if (searchDto.offset) {
          queryBuilder.skip(searchDto.offset);
        }
        
        return await queryBuilder.getMany();
      }

      if (searchDto.limit) {
        options.take = searchDto.limit;
      }

      if (searchDto.offset) {
        options.skip = searchDto.offset;
      }
    }

    return await this.productRepository.find(options);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByCode(productCode: string): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { product_code: productCode } 
    });
    if (!product) {
      throw new NotFoundException(`Product with code ${productCode} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async getCount(): Promise<number> {
    return await this.productRepository.count();
  }

  async getActiveCount(): Promise<number> {
    return await this.productRepository.count({ where: { is_active: true } });
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    avgPrice: number;
    totalValue: number;
  }> {
    const [total, active] = await Promise.all([
      this.getCount(),
      this.getActiveCount(),
    ]);

    const priceStats = await this.productRepository
      .createQueryBuilder('product')
      .select('AVG(product.selling_price_per_unit)', 'avgPrice')
      .addSelect('SUM(product.selling_price_per_unit)', 'totalValue')
      .where('product.selling_price_per_unit IS NOT NULL')
      .getRawOne();

    return {
      total,
      active,
      inactive: total - active,
      avgPrice: parseFloat(priceStats.avgPrice) || 0,
      totalValue: parseFloat(priceStats.totalValue) || 0,
    };
  }

  async searchByDimensions(
    minThickness?: number,
    maxThickness?: number,
    minWidth?: number,
    maxWidth?: number,
    minLength?: number,
    maxLength?: number,
  ): Promise<Product[]> {
    const query = this.productRepository.createQueryBuilder('product');

    if (minThickness) {
      query.andWhere('product.thickness_mm >= :minThickness', { minThickness });
    }
    if (maxThickness) {
      query.andWhere('product.thickness_mm <= :maxThickness', { maxThickness });
    }
    if (minWidth) {
      query.andWhere('product.width_mm >= :minWidth', { minWidth });
    }
    if (maxWidth) {
      query.andWhere('product.width_mm <= :maxWidth', { maxWidth });
    }
    if (minLength) {
      query.andWhere('product.length_mm >= :minLength', { minLength });
    }
    if (maxLength) {
      query.andWhere('product.length_mm <= :maxLength', { maxLength });
    }

    return await query.getMany();
  }
}