import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface ProductInfo {
  id: string;
  name: string;
  category: string;
  productCode?: string;
  description?: string;
}

export interface ServiceInfo {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: string;
  material: string;
  installationMethod: string;
  flooringForm: string;
  pattern: string;
  basePricePerM2: number;
  minimumCharge: number;
}

@Injectable()
export class ServiceMatcher {
  private readonly logger = new Logger(ServiceMatcher.name);
  private servicesCache: ServiceInfo[] = [];
  private lastCacheUpdate: Date = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(private readonly httpService: HttpService) {}

  /**
   * Match a product with appropriate installation services
   */
  async matchProductToServices(product: ProductInfo): Promise<ServiceInfo[]> {
    const services = await this.getAllServices();
    const productName = product.name.toLowerCase();
    const matchedServices: ServiceInfo[] = [];

    // Keywords for material detection
    const materialKeywords = {
      wood: ['drewn', 'dąb', 'jesion', 'buk', 'orzech', 'wiśnia', 'klon', 'brzoza', 'sosna'],
      laminate: ['laminat', 'laminowan'],
      vinyl: ['winyl', 'lvt', 'spc', 'vinyl']
    };

    // Keywords for form detection
    const formKeywords = {
      parquet: ['parkiet', 'mozaika'],
      plank: ['deska', 'panel']
    };

    // Keywords for installation method
    const installKeywords = {
      click: ['click', 'zatrzask', 'bezklejow'],
      glue: ['klej', 'klejona', 'klejony']
    };

    // Pattern keywords
    const patternKeywords = {
      herringbone: ['jodła', 'jodel', 'herringbone', 'chevron'],
      classic: ['klasyczna', 'klasyczny'],
      french: ['francuska', 'francuski']
    };

    // Detect material
    let detectedMaterial: string = null;
    for (const [material, keywords] of Object.entries(materialKeywords)) {
      if (keywords.some(keyword => productName.includes(keyword))) {
        detectedMaterial = material;
        break;
      }
    }

    // Detect form
    let detectedForm: string = null;
    for (const [form, keywords] of Object.entries(formKeywords)) {
      if (keywords.some(keyword => productName.includes(keyword))) {
        detectedForm = form;
        break;
      }
    }

    // Detect installation method
    let detectedInstallation: string = null;
    for (const [method, keywords] of Object.entries(installKeywords)) {
      if (keywords.some(keyword => productName.includes(keyword))) {
        detectedInstallation = method;
        break;
      }
    }

    // Detect pattern
    let hasHerringbone = false;
    let isClassic = false;
    let isFrench = false;
    
    if (patternKeywords.herringbone.some(k => productName.includes(k))) {
      hasHerringbone = true;
      if (patternKeywords.classic.some(k => productName.includes(k))) {
        isClassic = true;
      } else if (patternKeywords.french.some(k => productName.includes(k))) {
        isFrench = true;
      }
    }

    // Default values if not detected
    if (!detectedMaterial) {
      // If product category is 'flooring', assume it needs installation
      if (product.category === 'flooring') {
        detectedMaterial = 'wood'; // Default to wood
      }
    }
    if (!detectedForm) detectedForm = 'plank'; // Default to plank
    if (!detectedInstallation) detectedInstallation = 'glue'; // Default to glue

    // Filter services based on detected attributes
    for (const service of services) {
      let isMatch = false;

      // Material match
      if (detectedMaterial) {
        const materialMap = {
          wood: 'drewno',
          laminate: 'laminat',
          vinyl: 'winyl'
        };
        
        if (service.material === materialMap[detectedMaterial]) {
          isMatch = true;
        }
      }

      // Installation method match
      if (isMatch && detectedInstallation) {
        const installMap = {
          click: 'click',
          glue: 'klej'
        };
        
        if (service.installationMethod !== installMap[detectedInstallation]) {
          isMatch = false;
        }
      }

      // Form match
      if (isMatch && detectedForm) {
        const formMap = {
          parquet: 'parkiet',
          plank: 'deska'
        };
        
        if (service.flooringForm !== formMap[detectedForm]) {
          isMatch = false;
        }
      }

      // Pattern match
      if (isMatch && hasHerringbone) {
        if (isClassic && !service.pattern.includes('klasyczna')) {
          isMatch = false;
        } else if (isFrench && !service.pattern.includes('francuska')) {
          isMatch = false;
        }
      }

      if (isMatch) {
        matchedServices.push(service);
      }
    }

    // If no matches found, return some default services based on category
    if (matchedServices.length === 0 && product.category === 'flooring') {
      // Return most common services as fallback
      const fallbackServices = services.filter(s => 
        s.serviceCode === 'WOOD_GLUE_PLANK_REGULAR' ||
        s.serviceCode === 'WOOD_CLICK_PLANK_REGULAR' ||
        s.serviceCode === 'LAMINATE_CLICK_PLANK_REGULAR'
      );
      return fallbackServices;
    }

    // Sort by price (cheapest first)
    matchedServices.sort((a, b) => a.basePricePerM2 - b.basePricePerM2);

    this.logger.debug(`Matched ${matchedServices.length} services for product: ${product.name}`);
    
    return matchedServices;
  }

  /**
   * Get transport service
   */
  async getTransportService(): Promise<ServiceInfo | null> {
    const services = await this.getAllServices();
    return services.find(s => s.serviceCode === 'TRANSPORT_DELIVERY') || null;
  }

  /**
   * Get baseboard services matching the flooring type
   */
  async getBaseboardServices(flooringMaterial?: string): Promise<ServiceInfo[]> {
    const services = await this.getAllServices();
    
    // Filter baseboard services
    const baseboardServices = services.filter(s => s.category === 'baseboards');

    // If we have flooring material, we could prioritize certain baseboards
    // For now, return all baseboard services sorted by price
    return baseboardServices.sort((a, b) => a.basePricePerM2 - b.basePricePerM2);
  }

  /**
   * Get service by code
   */
  async getServiceByCode(serviceCode: string): Promise<ServiceInfo | null> {
    const services = await this.getAllServices();
    return services.find(s => s.serviceCode === serviceCode) || null;
  }

  /**
   * Get all services from the services microservice
   */
  private async getAllServices(): Promise<ServiceInfo[]> {
    // Check cache
    if (this.servicesCache.length > 0 && 
        this.lastCacheUpdate && 
        (Date.now() - this.lastCacheUpdate.getTime()) < this.CACHE_TTL) {
      return this.servicesCache;
    }

    try {
      const servicesUrl = process.env.SERVICES_SERVICE_URL || 'http://services-service:3007';
      const response = await firstValueFrom(
        this.httpService.get(`${servicesUrl}/services`, {
          params: {
            limit: 100,
            status: 'active'
          }
        })
      );

      if (response.data && (response.data as any).data) {
        this.servicesCache = (response.data as any).data;
        this.lastCacheUpdate = new Date();
        this.logger.log(`Cached ${this.servicesCache.length} active services`);
      }

      return this.servicesCache;
    } catch (error) {
      this.logger.error('Failed to fetch services:', error.message);
      return [];
    }
  }

  /**
   * Clear services cache
   */
  clearCache(): void {
    this.servicesCache = [];
    this.lastCacheUpdate = null;
  }
}