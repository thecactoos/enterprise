import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

@Entity('clients')
@Index(['email'])
@Index(['company'])
@Index(['isActive'])
@Index(['createdAt'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsOptional()
  phone: string;

  @Column({ nullable: true })
  @IsOptional()
  company: string;

  @Column({ nullable: true })
  @IsOptional()
  address: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 