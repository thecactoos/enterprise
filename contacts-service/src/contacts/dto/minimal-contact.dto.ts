import { IsNotEmpty, Length } from 'class-validator';

export class MinimalContactDto {
  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;
}