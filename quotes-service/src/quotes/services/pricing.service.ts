import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ProductPricing {
  product_name: string;
  price_per_m2: number;
  installation_price_per_m2: number;
  sanding_price_per_m2: number;
  transport_price: number;
}

export interface ServiceResponse {
  id: string;
  serviceName: string;
  serviceCode: string;
  category: string;
  material: string;
  installationMethod: string;
  basePricePerM2: number;
  standardPrice: number;
  minimumCharge: number;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly servicesBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.servicesBaseUrl = this.configService.get<string>('SERVICES_SERVICE_URL', 'http://services-service:3007');
  }

  async getPrices(productId: string): Promise<ProductPricing> {
    try {
      // Get product information (would come from products-service in real implementation)
      const productInfo = await this.getProductInfo(productId);
      
      // Get relevant services from services-service
      const services = await this.getServicesForProduct(productInfo);
      
      // Calculate pricing based on services
      return this.calculateProductPricing(productInfo, services);
    } catch (error) {
      this.logger.error(`Failed to get pricing for product ${productId}:`, error.message);
      
      // Fallback to mock data if services-service is unavailable
      return this.getMockPricing(productId);
    }
  }

  private async getProductInfo(productId: string): Promise<any> {
    // Mock product info - in real implementation this would come from products-service
    const mockProducts: { [key: string]: any } = {
      '123e4567-e89b-12d3-a456-426614174000': {
        id: productId,
        name: 'Deska dębowa 14mm',
        material: 'drewno',
        form: 'deska',
        installation_methods: ['klej', 'click'],
        price_per_m2: 120.00
      },
      '123e4567-e89b-12d3-a456-426614174001': {
        id: productId,
        name: 'Parkiet drewniany Jesion',
        material: 'drewno',
        form: 'parkiet',
        installation_methods: ['klej'],
        price_per_m2: 145.00
      },
      '123e4567-e89b-12d3-a456-426614174002': {
        id: productId,
        name: 'Panele laminowane Sosna',
        material: 'laminat',
        form: 'deska',
        installation_methods: ['click'],
        price_per_m2: 45.00
      }
    };

    const product = mockProducts[productId];
    if (!product) {
      throw new NotFoundException(`Product not found for ID: ${productId}`);
    }

    return product;
  }

  private async getServicesForProduct(productInfo: any): Promise<ServiceResponse[]> {
    try {
      // Query services-service for relevant services
      const url = `${this.servicesBaseUrl}/services`;
      const params = {
        material: productInfo.material,
        status: 'active',
        limit: 50
      };

      this.logger.log(`Fetching services from: ${url}`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, { params })
      );

      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch services:', error.message);
      return [];
    }
  }

  private calculateProductPricing(productInfo: any, services: ServiceResponse[]): ProductPricing {
    // Find specific services for pricing calculation
    const installationService = services.find(s => 
      s.material === productInfo.material && 
      (s.category?.includes('glue') || s.category?.includes('click'))
    );
    
    const sandingService = services.find(s => 
      s.serviceName?.toLowerCase().includes('szlif')
    );
    
    const transportService = services.find(s => 
      s.category === 'transport'
    );

    return {
      product_name: productInfo.name,
      price_per_m2: productInfo.price_per_m2,
      installation_price_per_m2: installationService?.basePricePerM2 || 45.00,
      sanding_price_per_m2: sandingService?.basePricePerM2 || 25.00,
      transport_price: transportService?.minimumCharge || 150.00
    };
  }

  private getMockPricing(productId: string): ProductPricing {
    // Fallback mock data when services-service is unavailable
    const mockDatabase = new Map<string, ProductPricing>([
      ['123e4567-e89b-12d3-a456-426614174000', {
        product_name: 'Panele podłogowe Dąb Classic',
        price_per_m2: 85.50,
        installation_price_per_m2: 25.00,
        sanding_price_per_m2: 15.00,
        transport_price: 150.00
      }],
      ['123e4567-e89b-12d3-a456-426614174001', {
        product_name: 'Parkiet drewniany Jesion',
        price_per_m2: 145.00,
        installation_price_per_m2: 35.00,
        sanding_price_per_m2: 20.00,
        transport_price: 200.00
      }],
      ['123e4567-e89b-12d3-a456-426614174002', {
        product_name: 'Panele laminowane Sosna',
        price_per_m2: 45.00,
        installation_price_per_m2: 20.00,
        sanding_price_per_m2: 12.00,
        transport_price: 100.00
      }]
    ]);

    const pricing = mockDatabase.get(productId);
    if (!pricing) {
      throw new NotFoundException(`Product pricing not found for ID: ${productId}`);
    }

    this.logger.warn(`Using fallback mock pricing for product ${productId}`);
    return pricing;
  }
}