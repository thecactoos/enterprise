import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ClientsService {
  private readonly clientsServiceUrl = process.env.CLIENTS_SERVICE_URL || 'http://clients-service:3002';

  async findAll() {
    const response = await axios.get(`${this.clientsServiceUrl}/clients`);
    return response.data;
  }

  async findOne(id: string) {
    const response = await axios.get(`${this.clientsServiceUrl}/clients/${id}`);
    return response.data;
  }

  async create(clientData: any) {
    const response = await axios.post(`${this.clientsServiceUrl}/clients`, clientData);
    return response.data;
  }

  async update(id: string, clientData: any) {
    const response = await axios.put(`${this.clientsServiceUrl}/clients/${id}`, clientData);
    return response.data;
  }

  async remove(id: string) {
    const response = await axios.delete(`${this.clientsServiceUrl}/clients/${id}`);
    return response.data;
  }
} 