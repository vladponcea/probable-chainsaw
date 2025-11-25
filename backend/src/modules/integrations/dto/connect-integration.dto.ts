import { IsString, IsNotEmpty } from 'class-validator';

export class ConnectIntegrationDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

