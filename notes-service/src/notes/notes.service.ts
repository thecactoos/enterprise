import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async findAll(): Promise<Note[]> {
    return this.notesRepository.find();
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.notesRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async findByClient(clientId: string): Promise<Note[]> {
    return this.notesRepository.find({ where: { clientId } });
  }

  async create(noteData: Partial<Note>): Promise<Note> {
    const note = this.notesRepository.create(noteData);
    return this.notesRepository.save(note);
  }

  async update(id: string, noteData: Partial<Note>): Promise<Note> {
    const note = await this.findOne(id);
    Object.assign(note, noteData);
    return this.notesRepository.save(note);
  }

  async remove(id: string): Promise<void> {
    const note = await this.findOne(id);
    await this.notesRepository.remove(note);
  }
} 