import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UsersService {
  private readonly usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://users-service:3001';

  async findAll() {
    const response = await axios.get(`${this.usersServiceUrl}/users`);
    return response.data;
  }

  async findOne(id: string) {
    const response = await axios.get(`${this.usersServiceUrl}/users/${id}`);
    return response.data;
  }

  async create(userData: any) {
    const response = await axios.post(`${this.usersServiceUrl}/users`, userData);
    return response.data;
  }

  async update(id: string, userData: any) {
    const response = await axios.put(`${this.usersServiceUrl}/users/${id}`, userData);
    return response.data;
  }

  async remove(id: string) {
    const response = await axios.delete(`${this.usersServiceUrl}/users/${id}`);
    return response.data;
  }
} 