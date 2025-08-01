import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [HttpModule],
  controllers: [ContactsController],
})
export class ContactsModule {}