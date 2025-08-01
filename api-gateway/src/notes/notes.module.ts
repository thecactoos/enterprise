import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [HttpModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {} 