import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotesService {
  private readonly notesServiceUrl = process.env.NOTES_SERVICE_URL || 'http://notes-service:3003';

  async findAll() {
    const response = await axios.get(`${this.notesServiceUrl}/notes`);
    return response.data;
  }

  async findOne(id: string) {
    const response = await axios.get(`${this.notesServiceUrl}/notes/${id}`);
    return response.data;
  }

  async findByClient(clientId: string) {
    const response = await axios.get(`${this.notesServiceUrl}/notes/client/${clientId}`);
    return response.data;
  }

  async create(noteData: any) {
    const response = await axios.post(`${this.notesServiceUrl}/notes`, noteData);
    return response.data;
  }

  async update(id: string, noteData: any) {
    const response = await axios.put(`${this.notesServiceUrl}/notes/${id}`, noteData);
    return response.data;
  }

  async remove(id: string) {
    const response = await axios.delete(`${this.notesServiceUrl}/notes/${id}`);
    return response.data;
  }
} 