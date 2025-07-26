import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@Entity('notes')
@Index(['clientId'])
@Index(['userId'])  
@Index(['isImportant'])
@Index(['createdAt'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  content: string;

  @Column()
  @IsUUID()
  clientId: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUUID()
  userId: string;

  @Column({ default: false })
  isImportant: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 