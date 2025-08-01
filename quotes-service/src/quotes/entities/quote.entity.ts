import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { QuoteItem } from './quote-item.entity';

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  NEGOTIATION = 'NEGOTIATION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

@Entity('quotes')
@Index(['contactId'])
@Index(['status'])
@Index(['quoteNumber'], { unique: true })
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @Column('uuid')
  @ApiProperty({ description: 'Contact (Lead/Client) ID' })
  contactId: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Quote number (auto-generated)' })
  quoteNumber: string;

  @Column({ default: 1 })
  @ApiProperty({ description: 'Version number for tracking changes' })
  version: number;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.DRAFT
  })
  @ApiProperty({ enum: QuoteStatus })
  status: QuoteStatus;

  // Dates
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => "CURRENT_TIMESTAMP + INTERVAL '30 days'" 
  })
  validUntil: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  // Financial
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @ApiProperty({ description: 'Subtotal net amount' })
  subtotalNet: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @ApiProperty({ description: 'Subtotal gross amount' })
  subtotalGross: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @ApiProperty({ description: 'Total net amount' })
  totalNet: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @ApiProperty({ description: 'Total gross amount' })
  totalGross: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @ApiProperty({ description: 'VAT amount' })
  vatAmount: number;

  @Column({ length: 3, default: 'PLN' })
  currency: string;

  // Details
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions?: string;

  // Delivery & Payment
  @Column({ nullable: true })
  deliveryMethod?: string;

  @Column({ type: 'text', nullable: true })
  deliveryAddress?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deliveryCost: number;

  @Column({ default: 'Przelew 14 dni' })
  paymentTerms: string;

  // Relations
  @Column('uuid', { nullable: true })
  createdByUserId?: string;

  @Column('uuid', { nullable: true })
  assignedUserId?: string;

  @Column('uuid', { nullable: true })
  previousVersionId?: string;

  @Column('uuid', { nullable: true })
  convertedToOrderId?: string;

  // Metadata
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @ApiProperty({ description: 'Project area in m²' })
  projectArea?: number;

  @Column({ default: false })
  installationIncluded: boolean;

  @Column({ default: false })
  measurementIncluded: boolean;

  // Relations
  @OneToMany(() => QuoteItem, item => item.quote, { 
    cascade: true,
    eager: true 
  })
  items: QuoteItem[];

  // Virtual properties
  get itemCount(): number {
    return this.items?.length || 0;
  }

  get isExpired(): boolean {
    return new Date() > new Date(this.validUntil);
  }

  get canBeEdited(): boolean {
    return this.status === QuoteStatus.DRAFT || this.status === QuoteStatus.NEGOTIATION;
  }

  get daysUntilExpiry(): number {
    const now = new Date();
    const expiry = new Date(this.validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}