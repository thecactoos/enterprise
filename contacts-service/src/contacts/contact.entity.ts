import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsNumber, Min, Max, Length, IsPhoneNumber } from 'class-validator';

export enum ContactType {
  LEAD = 'LEAD',        // prospektywny klient
  CLIENT = 'CLIENT'     // aktywny klient
}

export enum ContactSource {
  WEBSITE = 'website',              // strona internetowa
  REFERRAL = 'referral',            // polecenie
  SOCIAL_MEDIA = 'social_media',    // media społecznościowe
  FACEBOOK = 'facebook',            // facebook
  LINKEDIN = 'linkedin',            // linkedin
  EMAIL = 'email',                  // email
  TRADE_SHOW = 'trade_show',        // targi
  ADVERTISEMENT = 'advertisement',   // reklama
  COLD_CALL = 'cold_call',          // cold calling
  EVENT = 'event',                  // wydarzenie/targi
  EMAIL_CAMPAIGN = 'email_campaign', // kampania email
  DIRECT_CONTACT = 'direct_contact', // bezpośredni kontakt
  PARTNERSHIP = 'partnership',       // partnerstwo
  OTHER = 'other'                   // inne
}

export enum ContactStatus {
  // Lead statuses
  NEW = 'new',                      // nowy
  CONTACTED = 'contacted',          // skontaktowany
  QUALIFIED = 'qualified',          // zakwalifikowany
  PROPOSAL_SENT = 'proposal_sent',  // wysłana oferta
  NEGOTIATION = 'negotiation',      // negocjacje
  UNQUALIFIED = 'unqualified',      // niezakwalifikowany
  LOST = 'lost',                    // utracony
  ON_HOLD = 'on_hold',              // wstrzymany
  NURTURING = 'nurturing',          // pielęgnowany
  
  // Client statuses
  CONVERTED = 'converted',          // skonwertowany (nowy klient)
  ACTIVE = 'active',                // aktywny klient
  INACTIVE = 'inactive',            // nieaktywny klient
  VIP = 'vip',                      // klient VIP
  CHURNED = 'churned'               // utracony klient
}

export enum ContactPriority {
  LOW = 'low',                      // niski
  MEDIUM = 'medium',                // średni
  HIGH = 'high',                    // wysoki
  URGENT = 'urgent'                 // pilny
}

export enum BusinessType {
  B2B = 'b2b',                      // business to business
  B2C = 'b2c',                      // business to consumer
  B2G = 'b2g',                      // business to government
  DISTRIBUTOR = 'distributor',      // dystrybutor
  CONTRACTOR = 'contractor',        // wykonawca
  ARCHITECT = 'architect',          // architekt
  DESIGNER = 'designer'             // projektant
}

export enum ProjectType {
  RESIDENTIAL = 'residential',      // mieszkaniowy
  COMMERCIAL = 'commercial',        // komercyjny
  NEW_CONSTRUCTION = 'new_construction', // nowa budowa
  RENOVATION = 'renovation',        // remont
  OFFICE = 'office',                // biurowy
  HOTEL = 'hotel',                  // hotelowy
  RESTAURANT = 'restaurant',        // restauracyjny
  RETAIL = 'retail',                // handlowy
  INDUSTRIAL = 'industrial',        // przemysłowy
  PUBLIC = 'public',                // publiczny
  OTHER = 'other'                   // inne
}

@Entity('contacts')
@Index(['email'])
@Index(['phone'])
@Index(['type'])
@Index(['status'])
@Index(['priority'])
@Index(['source'])
@Index(['businessType'])
@Index(['assignedUserId'])
@Index(['createdAt'])
@Index(['totalPurchases'])
@Index(['lastPurchaseDate'])
export class Contact {
  // ========================================
  // PRIMARY IDENTIFICATION
  // ========================================

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ContactType,
    default: ContactType.LEAD
  })
  @IsEnum(ContactType)
  type: ContactType;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  @Column()
  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @Column()
  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsPhoneNumber('PL') // Polish phone number validation
  phone: string;

  // ========================================
  // COMPANY/BUSINESS INFORMATION
  // ========================================

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 200)
  company: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 100)
  position: string; // stanowisko

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 20)
  nip: string; // Polish tax number

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 20)
  regon: string; // Polish business registry number

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 20)
  krs: string; // Polish court registry number

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 500)
  website: string; // strona internetowa

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 200)
  industry: string; // branża

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 100)
  companySize: string; // wielkość firmy (1-10, 11-50, 51-200, 200+)

  // ========================================
  // CONTACT CLASSIFICATION
  // ========================================

  @Column({
    type: 'enum',
    enum: ContactSource,
    default: ContactSource.OTHER
  })
  @IsEnum(ContactSource)
  source: ContactSource;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.NEW
  })
  @IsEnum(ContactStatus)
  status: ContactStatus;

  @Column({
    type: 'enum',
    enum: ContactPriority,
    default: ContactPriority.MEDIUM
  })
  @IsEnum(ContactPriority)
  priority: ContactPriority;

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.B2C
  })
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @Column({
    type: 'enum',
    enum: ProjectType,
    nullable: true
  })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @Length(1, 2000)
  projectDescription: string; // opis projektu

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 200)
  timeline: string; // harmonogram projektu

  // ========================================
  // FINANCIAL INFORMATION
  // ========================================

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedValue: number; // szacowana wartość w PLN

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedBudget: number; // szacowany budżet

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPurchases: number; // łączne zakupy (dla klientów)

  @Column({ default: 'PLN', length: 3 })
  currency: string;

  // ========================================
  // GEOGRAPHICAL INFORMATION
  // ========================================

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 200)
  address: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 200)
  street: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 100)
  city: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 20)
  postalCode: string; // Polish postal code format

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 100)
  voivodeship: string; // województwo

  @Column({ default: 'Poland' })
  country: string;

  // ========================================
  // TRACKING & ANALYTICS
  // ========================================

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 200)
  sourceDetails: string; // szczegóły źródła

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  requirements: string[]; // wymagania

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes: string; // notatki

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  tags: string[]; // tagi

  @Column({ type: 'int', default: 0 })
  @Min(0)
  @Max(100)
  qualificationScore: number; // wynik kwalifikacji 0-100

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @Min(1)
  @Max(10)
  interestLevel: number; // poziom zainteresowania 1-10

  @Column({ type: 'int', default: 0 })
  @Min(0)
  contactAttempts: number; // liczba prób kontaktu

  // ========================================
  // DATES & TIMELINE
  // ========================================

  @Column({ nullable: true })
  @IsOptional()
  firstContactDate: Date; // data pierwszego kontaktu

  @Column({ nullable: true })
  @IsOptional()
  lastContactDate: Date; // data ostatniego kontaktu

  @Column({ nullable: true })
  @IsOptional()
  nextFollowUpDate: Date; // data następnego kontaktu

  @Column({ nullable: true })
  @IsOptional()
  expectedCloseDate: Date; // oczekiwana data zamknięcia

  @Column({ nullable: true })
  @IsOptional()
  lastPurchaseDate: Date; // data ostatniego zakupu (dla klientów)

  @Column({ nullable: true })
  @IsOptional()
  clientSince: Date; // klient od kiedy

  @Column({ nullable: true })
  @IsOptional()
  convertedAt: Date; // data konwersji

  // ========================================
  // RELATIONSHIPS
  // ========================================

  @Column({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedUserId: string; // przypisany użytkownik

  // ========================================
  // METADATA
  // ========================================

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  gdprConsent: boolean; // zgoda RODO

  @Column({ nullable: true })
  @IsOptional()
  gdprConsentDate: Date;

  @Column({ default: false })
  marketingConsent: boolean; // zgoda na marketing

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  customFields: Record<string, any>; // pola niestandardowe

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName(): string {
    if (this.company) {
      return `${this.fullName} (${this.company})`;
    }
    return this.fullName;
  }

  get contactInfo(): string {
    const parts = [this.email];
    if (this.phone) parts.push(this.phone);
    return parts.join(' | ');
  }

  get isLead(): boolean {
    return this.type === ContactType.LEAD;
  }

  get isClient(): boolean {
    return this.type === ContactType.CLIENT;
  }

  get daysSinceCreated(): number {
    const now = new Date();
    const created = new Date(this.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  get daysSinceLastContact(): number {
    if (!this.lastContactDate) return this.daysSinceCreated;
    const now = new Date();
    const lastContact = new Date(this.lastContactDate);
    return Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
  }

  get isOverdue(): boolean {
    if (!this.nextFollowUpDate) return false;
    return new Date() > new Date(this.nextFollowUpDate);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  isQualified(): boolean {
    return this.qualificationScore >= 60 && 
           this.status !== ContactStatus.UNQUALIFIED && 
           this.status !== ContactStatus.LOST;
  }

  needsFollowUp(): boolean {
    if (this.type === ContactType.CLIENT) {
      // For clients, check if inactive for too long
      return this.status === ContactStatus.INACTIVE || 
             (this.lastPurchaseDate && 
              new Date().getTime() - new Date(this.lastPurchaseDate).getTime() > 90 * 24 * 60 * 60 * 1000);
    }

    // For leads
    if (this.status === ContactStatus.CONVERTED || 
        this.status === ContactStatus.LOST || 
        this.status === ContactStatus.UNQUALIFIED) {
      return false;
    }

    if (this.nextFollowUpDate && new Date() >= new Date(this.nextFollowUpDate)) {
      return true;
    }

    // Auto follow-up rules based on days since last contact
    const daysSinceContact = this.daysSinceLastContact;
    const followUpDays = {
      [ContactPriority.URGENT]: 1,
      [ContactPriority.HIGH]: 3,
      [ContactPriority.MEDIUM]: 7,
      [ContactPriority.LOW]: 14
    };

    return daysSinceContact >= (followUpDays[this.priority] || 7);
  }

  convertToClient(): void {
    this.type = ContactType.CLIENT;
    this.status = ContactStatus.CONVERTED;
    this.convertedAt = new Date();
    this.clientSince = new Date();
  }

  addPurchase(amount: number): void {
    this.totalPurchases += amount;
    this.lastPurchaseDate = new Date();
    if (this.type === ContactType.LEAD) {
      this.convertToClient();
    } else {
      this.status = ContactStatus.ACTIVE;
    }
  }

  getRecommendedNextActions(): string[] {
    const actions = [];

    if (this.needsFollowUp()) {
      actions.push('Zaplanuj kontakt');
    }

    if (this.type === ContactType.LEAD) {
      if (this.status === ContactStatus.NEW) {
        actions.push('Wykonaj pierwszy kontakt');
      } else if (this.status === ContactStatus.CONTACTED) {
        actions.push('Zakwalifikuj kontakt');
      } else if (this.status === ContactStatus.QUALIFIED) {
        actions.push('Przygotuj ofertę');
      } else if (this.status === ContactStatus.PROPOSAL_SENT) {
        actions.push('Sprawdź status oferty');
      } else if (this.status === ContactStatus.NEGOTIATION) {
        actions.push('Kontynuuj negocjacje');
      }
    } else if (this.type === ContactType.CLIENT) {
      if (this.status === ContactStatus.INACTIVE) {
        actions.push('Reaktywuj klienta');
      } else if (this.status === ContactStatus.ACTIVE) {
        actions.push('Zaproponuj dodatkowe produkty');
      }
    }

    if (this.priority === ContactPriority.URGENT && this.daysSinceLastContact > 1) {
      actions.push('PILNY: Natychmiastowy kontakt');
    }

    if (!this.assignedUserId) {
      actions.push('Przypisz do pracownika');
    }

    return actions;
  }
}