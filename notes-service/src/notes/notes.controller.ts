import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from './note.entity';

@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  findAll(): Promise<Note[]> {
    return this.notesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Note> {
    return this.notesService.findOne(id);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string): Promise<Note[]> {
    return this.notesService.findByClient(clientId);
  }

  @Post()
  create(@Body() noteData: Partial<Note>): Promise<Note> {
    return this.notesService.create(noteData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() noteData: Partial<Note>): Promise<Note> {
    return this.notesService.update(id, noteData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.notesService.remove(id);
  }
} 