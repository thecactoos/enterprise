import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotesService {
  private readonly notesServiceUrl = process.env.NOTES_SERVICE_URL || 'http://notes-service:3003';

  constructor(private readonly httpService: HttpService) {}

  async findAll() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.notesServiceUrl}/notes`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch notes',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findOne(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.notesServiceUrl}/notes/${id}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch note',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByClient(clientId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.notesServiceUrl}/notes/client/${clientId}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch client notes',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async create(noteData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.notesServiceUrl}/notes`, noteData)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create note',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(id: string, noteData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.notesServiceUrl}/notes/${id}`, noteData)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to update note',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async remove(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.notesServiceUrl}/notes/${id}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to delete note',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 