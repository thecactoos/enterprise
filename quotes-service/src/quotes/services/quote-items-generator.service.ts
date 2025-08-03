import { Injectable, Logger } from '@nestjs/common';
import { ProductPricing } from './pricing.service';
import { QuoteItemResponse } from '../dto/create-simple-quote.dto';

@Injectable()
export class QuoteItemsGeneratorService {
  private readonly logger = new Logger(QuoteItemsGeneratorService.name);
  
  generateItems(
    area: number, 
    pricing: ProductPricing, 
    withInstallation: boolean
  ): QuoteItemResponse[] {
    const items: QuoteItemResponse[] = [];

    this.logger.log(`Generating quote items for area: ${area}m², withInstallation: ${withInstallation}`);

    // Always add the product
    items.push({
      name: pricing.product_name,
      unit: 'm²',
      quantity: area,
      unit_price: pricing.price_per_m2,
      total_price: this.roundPrice(area * pricing.price_per_m2)
    });

    if (withInstallation) {
      // Add installation services based on material type
      const installationServiceName = this.getInstallationServiceName(pricing.product_name);
      items.push({
        name: installationServiceName,
        unit: 'm²',
        quantity: area,
        unit_price: pricing.installation_price_per_m2,
        total_price: this.roundPrice(area * pricing.installation_price_per_m2)
      });

      // Add sanding/preparation service
      const sandingServiceName = this.getSandingServiceName(pricing.product_name);
      items.push({
        name: sandingServiceName,
        unit: 'm²',
        quantity: area,
        unit_price: pricing.sanding_price_per_m2,
        total_price: this.roundPrice(area * pricing.sanding_price_per_m2)
      });

      // Add connection/finishing service (calculated based on area perimeter)
      const connectionQuantity = this.calculateConnectionQuantity(area);
      items.push({
        name: 'Łączenie na styk',
        unit: 'mb',
        quantity: connectionQuantity,
        unit_price: 12.50,
        total_price: this.roundPrice(connectionQuantity * 12.50)
      });
    }

    // Always add transport (fixed quantity but price from services)
    items.push({
      name: 'Transport i dostawa',
      unit: 'szt.',
      quantity: 1,
      unit_price: pricing.transport_price,
      total_price: pricing.transport_price
    });

    this.logger.log(`Generated ${items.length} quote items, total: ${this.calculateTotal(items)} PLN`);

    return items;
  }

  private getInstallationServiceName(productName: string): string {
    const lowerProductName = productName.toLowerCase();
    
    if (lowerProductName.includes('parkiet') || lowerProductName.includes('drewn')) {
      return 'Montaż podłogi drewnianej na klej';
    } else if (lowerProductName.includes('laminat')) {
      return 'Montaż podłogi laminowanej (click)';
    } else if (lowerProductName.includes('winyl') || lowerProductName.includes('vinyl')) {
      return 'Montaż podłogi winylowej';
    }
    
    return 'Montaż podłogi';
  }

  private getSandingServiceName(productName: string): string {
    const lowerProductName = productName.toLowerCase();
    
    if (lowerProductName.includes('parkiet') || lowerProductName.includes('drewn')) {
      return 'Przygotowanie podłoża pod klej';
    } else if (lowerProductName.includes('laminat') || lowerProductName.includes('winyl')) {
      return 'Wyrównanie podłoża';
    }
    
    return 'Przygotowanie podłoża';
  }

  private calculateConnectionQuantity(area: number): number {
    // Estimate perimeter based on area (assuming rectangular room)
    // For simplicity, use sqrt(area) * 4 as rough perimeter estimate
    const estimatedPerimeter = Math.sqrt(area) * 4;
    return Math.round(estimatedPerimeter * 100) / 100;
  }

  private roundPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }

  private calculateTotal(items: QuoteItemResponse[]): number {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }
}