import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsString, Length, IsDecimal } from 'class-validator';

export enum ProductUnit {
  METER = 'mb',          // metr bieżący (linear meter)
  SQUARE_METER = 'm²',   // metr kwadratowy (square meter)
  PIECE = 'szt',         // sztuka (piece)
  PACKAGE = 'paczka',    // package
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export enum MaterialType {
  PVC = 'PVC',
  WOOD = 'wood',
  LAMINATE = 'laminate',
  VINYL = 'vinyl',
  COMPOSITE = 'composite',
  METAL = 'metal',
  OTHER = 'other',
}

@Entity('building_products')
@Index(['sku'])
@Index(['name'])
@Index(['material'])
@Index(['unit'])
@Index(['status'])
@Index(['purchase_price'])
@Index(['sale_price'])
@Index(['created_at'])
export class BuildingProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Core Product Information
  @Column({ unique: true })
  @IsNotEmpty()
  @Length(1, 50)
  sku: string; // kod_produktu

  @Column()
  @IsNotEmpty()
  @Length(1, 500)
  name: string; // nazwa_produktu

  @Column({ nullable: true, length: 1000 })
  @IsOptional()
  extended_name: string; // nieoficjalna_nazwa_produktu

  @Column({
    type: 'enum',
    enum: ProductUnit,
    default: ProductUnit.PIECE,
  })
  @IsEnum(ProductUnit)
  unit: ProductUnit; // jednostka_sprzedażowa

  // Material Specifications
  @Column({
    type: 'enum',
    enum: MaterialType,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(MaterialType)
  material: MaterialType; // materiał

  @Column({ nullable: true, length: 200 })
  @IsOptional()
  color: string; // kolor_/_barwa

  @Column({ nullable: true, length: 200 })
  @IsOptional()
  finish_type: string; // rodzaj_wykończenia

  @Column({ nullable: true, length: 200 })
  @IsOptional()
  surface: string; // powierzchnia

  @Column({ nullable: true, length: 200 })
  @IsOptional()
  edge_treatment: string; // fazowanie

  // Dimensions (in mm)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  thickness_mm: number; // grubość_[mm]

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  height_mm: number; // wysokość_[mm]

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

  // Sales Dimensions
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  sales_length_m: number; // długość_sprzedażowa_[mb]

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  package_area_m2: number; // paczka_[m²]

  // Pricing (in PLN)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchase_price: number; // cena_zakupu_netto

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sale_price: number; // cena_sprzedaży_netto

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  retail_price: number; // cena_detaliczna_netto

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  profit_margin: number; // potencjalny_zysk

  @Column({ default: 'PLN', length: 3 })
  @IsString()
  @Length(3, 3)
  currency: string;

  // Inventory Management
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  standard_stock_percent: number; // standardowy_zapas_[%]

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  current_stock: number;

  // Additional Information
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  additional_description: string; // dodatkowy_opis_przedmiotu

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  full_identifier: string; // result_value

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description: string;

  // Status and Metadata
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @Column({ default: true })
  is_active: boolean;

  // Original scraped data (for reference)
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  original_data: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Computed properties
  get profit_percentage(): number {
    if (this.sale_price && this.purchase_price && this.purchase_price > 0) {
      return ((this.sale_price - this.purchase_price) / this.purchase_price) * 100;
    }
    return 0;
  }

  get dimensions_string(): string {
    const parts = [];
    if (this.thickness_mm) parts.push(`${this.thickness_mm}mm`);
    if (this.width_mm) parts.push(`${this.width_mm}mm`);
    if (this.length_mm) parts.push(`${this.length_mm}mm`);
    return parts.join(' × ');
  }

  get display_name(): string {
    return this.extended_name || this.name;
  }
}