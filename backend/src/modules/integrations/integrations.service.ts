import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
  ) {}

  async validateCalendlyApiKey(apiKey: string): Promise<boolean> {
    // Stub function - in production, this would make an actual API call to Calendly
    // to validate the API key
    // For now, just check that it's not empty
    return apiKey && apiKey.length > 0;
  }

  async validateCloseApiKey(apiKey: string): Promise<boolean> {
    // Stub function - in production, this would make an actual API call to Close
    // to validate the API key
    // For now, just check that it's not empty
    return apiKey && apiKey.length > 0;
  }

  async validateStripeApiKey(apiKey: string): Promise<boolean> {
    // Stub function - in production, this would make an actual API call to Stripe
    // to validate the API key (e.g., check if it starts with sk_)
    // For now, just check that it's not empty and starts with sk_
    return apiKey && apiKey.length > 0 && apiKey.startsWith('sk_');
  }

  async connectCalendly(token: string, dto: ConnectIntegrationDto) {
    // Find client by token
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const client = await this.clientsService.findById(clientData.clientId);

    // Validate API key
    const isValid = await this.validateCalendlyApiKey(dto.apiKey);
    if (!isValid) {
      throw new BadRequestException('Invalid Calendly API key');
    }

    // Upsert integration
    await this.prisma.clientIntegration.upsert({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'calendly',
        },
      },
      update: {
        apiKey: dto.apiKey,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        provider: 'calendly',
        apiKey: dto.apiKey,
      },
    });

    // Update client flag
    await this.prisma.client.update({
      where: { id: client.id },
      data: { calendlyConnected: true },
    });

    return {
      success: true,
      message: 'Calendly connected',
    };
  }

  async connectClose(token: string, dto: ConnectIntegrationDto) {
    // Find client by token
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const client = await this.clientsService.findById(clientData.clientId);

    // Validate API key
    const isValid = await this.validateCloseApiKey(dto.apiKey);
    if (!isValid) {
      throw new BadRequestException('Invalid Close API key');
    }

    // Upsert integration
    await this.prisma.clientIntegration.upsert({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'close',
        },
      },
      update: {
        apiKey: dto.apiKey,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        provider: 'close',
        apiKey: dto.apiKey,
      },
    });

    // Update client flag
    await this.prisma.client.update({
      where: { id: client.id },
      data: { closeConnected: true },
    });

    return {
      success: true,
      message: 'Close CRM connected',
    };
  }

  async connectStripe(token: string, dto: ConnectIntegrationDto) {
    // Find client by token
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const client = await this.clientsService.findById(clientData.clientId);

    // Validate API key
    const isValid = await this.validateStripeApiKey(dto.apiKey);
    if (!isValid) {
      throw new BadRequestException('Invalid Stripe API key');
    }

    // Upsert integration
    await this.prisma.clientIntegration.upsert({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'stripe',
        },
      },
      update: {
        apiKey: dto.apiKey,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        provider: 'stripe',
        apiKey: dto.apiKey,
      },
    });

    // Update client flag
    await this.prisma.client.update({
      where: { id: client.id },
      data: { stripeConnected: true },
    });

    return {
      success: true,
      message: 'Stripe connected',
    };
  }
}

