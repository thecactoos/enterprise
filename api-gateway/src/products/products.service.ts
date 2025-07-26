import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService {
  private readonly productsServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.productsServiceUrl = this.configService.get<string>('PRODUCTS_SERVICE_URL') || 'http://products-service:3004';
  }

  async findAll(query: any = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          queryParams.append(key, query[key].toString());
        }
      });

      const url = `${this.productsServiceUrl}/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Products service error: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new HttpException(
        'Failed to fetch products from service',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.productsServiceUrl}/products/${id}`);
      
      if (!response.ok) {
        throw new HttpException(
          `Product not found: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new HttpException(
        'Failed to fetch product from service',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByCode(productCode: string): Promise<any> {
    try {
      const response = await fetch(`${this.productsServiceUrl}/products/code/${productCode}`);
      
      if (!response.ok) {
        throw new HttpException(
          `Product not found: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching product by code:', error);
      throw new HttpException(
        'Failed to fetch product from service',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.productsServiceUrl}/products/stats`);
      
      if (!response.ok) {
        throw new HttpException(
          `Stats service error: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw new HttpException(
        'Failed to fetch product stats from service',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchByDimensions(query: any): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          queryParams.append(key, query[key].toString());
        }
      });

      const url = `${this.productsServiceUrl}/products/search/dimensions?${queryParams.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Dimension search error: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching products by dimensions:', error);
      throw new HttpException(
        'Failed to search products by dimensions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}