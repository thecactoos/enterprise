import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsString, Length, IsUUID } from 'class-validator';

export enum ProductCategory {
  FLOORING = 'flooring',           // podłogi
  MOLDING = 'molding',             // listwy
  ACCESSORY = 'accessory',         // akcesoria
  PANEL = 'panel',                 // panele
  PROFILE = 'profile',             // profile
  OTHER = 'other'
}

export enum BaseUnit {
  MM = 'mm',                       // millimeter
  M = 'm',                         // meter  
  M2 = 'm²',                       // square meter
  PIECE = 'piece'                  // piece/item
}

export enum SellingUnit {
  LINEAR_METER = 'mb',             // metr bieżący
  SQUARE_METER = 'm²',             // metr kwadratowy  
  PIECE = 'szt',                   // sztuka
  PACKAGE = 'paczka'               // package
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock', 
  DISCONTINUED = 'discontinued'
}

@Entity('products')
@Index(['external_code'])
@Index(['name'])
@Index(['category'])
@Index(['selling_unit'])
@Index(['status'])
@Index(['selling_price'])
@Index(['is_active'])
@Index(['created_at'])
export class Product {
  // ========================================
  // PRIMARY IDENTIFICATION
  // ========================================
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  @IsOptional()
  @Length(1, 50)
  product_code: string; // Original kod_produktu from scraped data

  // ========================================
  // CORE PRODUCT INFORMATION  
  // ========================================

  @Column()
  @IsNotEmpty()
  @Length(1, 500)
  product_name: string; // nazwa_produktu

  @Column({ nullable: true, length: 1000 })
  @IsOptional()
  unofficial_product_name: string; // nieoficjalna_nazwa_produktu

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER
  })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  // ========================================
  // UNIT MANAGEMENT
  // ========================================

  @Column({
    type: 'enum', 
    enum: BaseUnit,
    default: BaseUnit.PIECE
  })
  @IsEnum(BaseUnit)
  measure_unit: BaseUnit; // Base measurement unit

  @Column({
    type: 'enum',
    enum: BaseUnit, 
    default: BaseUnit.PIECE
  })
  @IsEnum(BaseUnit)
  base_unit_for_pricing: BaseUnit; // What unit prices are based on

  @Column({
    type: 'enum',
    enum: SellingUnit,
    default: SellingUnit.PIECE
  })
  @IsEnum(SellingUnit)
  selling_unit: SellingUnit; // jednostka_sprzedażowa

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  measurement_units_per_selling_unit: number; // How many base units in one selling unit

  // ========================================
  // PRODUCT SPECIFICATIONS
  // ========================================

  @Column({ nullable: true, length: 200 })
  @IsOptional()
  type_of_finish: string; // rodzaj_wykończenia

  @Column({ nullable: true, length: 200 })
  @IsOptional() 
  surface: string; // powierzchnia

  @Column({ nullable: true, length: 200 })
  @IsOptional()
  bevel: string; // fazowanie

  // ========================================
  // DIMENSIONS (in mm)
  // ========================================

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  thickness_mm: number; // grubość_[mm]

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  width_mm: number; // szerokość_[mm]

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  length_mm: number; // długość_[mm]

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  package_m2: number; // paczka_[m²]

  // ========================================
  // PRODUCT DESCRIPTION
  // ========================================

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  additional_item_description: string; // dodatkowy_opis_przedmiotu

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description: string; // General description

  // ========================================
  // PRICING (per base unit)
  // ========================================

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  retail_price_per_unit: number; // cena_detaliczna_netto

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  selling_price_per_unit: number; // cena_sprzedaży_netto

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchase_price_per_unit: number; // cena_zakupu_netto

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  potential_profit: number; // potencjalny_zysk

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  installation_allowance: number; // Installation allowance percentage

  @Column({ default: 'PLN', length: 3 })
  @IsString()
  @Length(3, 3)
  currency: string;

  // ========================================
  // INVENTORY & STATUS
  // ========================================

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  current_stock: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  standard_stock_percent: number; // standardowy_zapas_[%]

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @Column({ default: true })
  is_active: boolean;

  // ========================================
  // METADATA
  // ========================================

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  original_scraped_data: Record<string, any>; // Original data for reference

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  get profit_percentage(): number {
    if (this.selling_price_per_unit && this.purchase_price_per_unit && this.purchase_price_per_unit > 0) {
      return ((this.selling_price_per_unit - this.purchase_price_per_unit) / this.purchase_price_per_unit) * 100;
    }
    return 0;
  }

  get profit_margin(): number {
    if (this.selling_price_per_unit && this.purchase_price_per_unit) {
      return this.selling_price_per_unit - this.purchase_price_per_unit;
    }
    return 0;
  }

  get dimensions_string(): string {
    const parts = [];
    if (this.thickness_mm) parts.push(`${this.thickness_mm}mm`);
    if (this.width_mm) parts.push(`${this.width_mm}mm`);
    if (this.length_mm) parts.push(`${this.length_mm}mm`);
    return parts.length > 0 ? parts.join(' × ') : null;
  }

  get display_name(): string {
    return this.unofficial_product_name || this.product_name;
  }

  get full_identifier(): string {
    const code = this.product_code ? `[${this.product_code}] ` : '';
    const dimensions = this.dimensions_string ? ` | ${this.dimensions_string}` : '';
    return `${code}${this.product_name}${dimensions}`;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  calculateTotalPrice(quantity: number): number {
    if (!this.selling_price_per_unit) return 0;
    const basePrice = this.selling_price_per_unit * quantity;
    const installationCost = basePrice * (this.installation_allowance / 100);
    return basePrice + installationCost;
  }

  isLowStock(threshold: number = 10): boolean {
    if (this.standard_stock_percent) {
      return this.current_stock < (this.standard_stock_percent * threshold / 100);
    }
    return this.current_stock < threshold;
  }

  getUnitConversion(): { from: string, to: string, ratio: number } {
    return {
      from: this.measure_unit,
      to: this.selling_unit,
      ratio: this.measurement_units_per_selling_unit
    };
  }
}