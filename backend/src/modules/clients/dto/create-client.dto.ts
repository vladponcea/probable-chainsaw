import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  companyName?: string;
}

