import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { SyncService } from '../sync/sync.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
    private syncService: SyncService,
  ) {}

  async validateCalendlyApiKey(apiKey: string): Promise<boolean> {
    // Stub function - in production, this would make an actual API call to Calendly
    // to validate the API key
    // For now, just check that it's not empty
    return apiKey && apiKey.length > 0;
  }

  async validateCloseApiKey(apiKey: string): Promise<boolean> {
    // Actually validate the API key by making a test API call
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    const trimmedKey = apiKey.trim();

    try {
      // Close CRM uses HTTP Basic auth: base64(apikey:)
      const authString = Buffer.from(`${trimmedKey}:`).toString('base64');
      const response = await axios.get('https://api.close.com/api/v1/me', {
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      // If we get a successful response, the key is valid
      return response.status === 200;
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Close API validation error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      // If we get 401/403, the key is invalid
      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorMsg = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        'Authentication failed';
        console.error(`Close API key validation failed: ${errorMsg}`);
        return false;
      }
      
      // For network errors or timeouts, allow connection but log warning
      // It will fail during sync if truly invalid
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || !error.response) {
        console.warn('Close API validation: Network error, allowing connection');
        return true;
      }
      
      // For other HTTP errors, assume invalid
      return false;
    }
  }

  async validateStripeApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    const trimmedKey = apiKey.trim();
    const isSecretKey = trimmedKey.startsWith('sk_');
    const isRestrictedKey = trimmedKey.startsWith('rk_');

    return isSecretKey || isRestrictedKey;
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

    // Check if integration already exists (update vs new)
    const existingIntegration = await this.prisma.clientIntegration.findUnique({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'calendly',
        },
      },
    });

    const isUpdate = !!existingIntegration && existingIntegration.apiKey !== dto.apiKey;

    // If updating (API key changed), delete all existing Calendly data
    if (isUpdate) {
      await this.prisma.bookedCall.deleteMany({
        where: {
          clientId: client.id,
          source: 'calendly',
        },
      });
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

    // If updating, trigger sync to fetch new data
    if (isUpdate) {
      try {
        await this.syncService.syncClient(client.id);
      } catch (error: any) {
        // Log error but don't fail the connection
        console.error(`Error syncing Calendly after API key update: ${error.message}`);
      }
    }

    return {
      success: true,
      message: isUpdate ? 'Calendly API key updated and data refreshed' : 'Calendly connected',
    };
  }

  async connectClose(token: string, dto: ConnectIntegrationDto) {
    // Find client by token
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const client = await this.clientsService.findById(clientData.clientId);

    // Trim whitespace from API key
    const trimmedKey = dto.apiKey.trim();

    // Validate API key format first
    if (!trimmedKey.startsWith('api_')) {
      throw new BadRequestException(
        'Invalid Close CRM API key format. API keys should start with "api_". ' +
        'You can find your API key in Close CRM Settings > Developer > API Keys'
      );
    }

    // Check if integration already exists (update vs new)
    const existingIntegration = await this.prisma.clientIntegration.findUnique({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'close',
        },
      },
    });

    const isUpdate = !!existingIntegration && existingIntegration.apiKey !== trimmedKey;

    // If updating (API key changed), delete all existing Close data
    if (isUpdate) {
      // Delete leads from Close
      await this.prisma.lead.deleteMany({
        where: {
          clientId: client.id,
          source: 'close',
        },
      });

      // Delete deals from Close
      await this.prisma.deal.deleteMany({
        where: {
          clientId: client.id,
          source: 'close',
        },
      });

      // Delete status mappings
      await this.prisma.opportunityStatusMapping.deleteMany({
        where: {
          clientId: client.id,
        },
      });
    }

    // Validate API key by making a test call
    try {
      const isValid = await this.validateCloseApiKey(trimmedKey);
      if (!isValid) {
        // If validation fails but it's a network error, allow it (will fail during sync if truly invalid)
        // Otherwise, throw error
        throw new BadRequestException(
          'Invalid Close CRM API key. Please check that your API key is correct and active. ' +
          'You can find your API key in Close CRM Settings > Developer > API Keys'
        );
      }
    } catch (error: any) {
      // If it's already a BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }
      // For network errors, allow the connection (it will be validated during sync)
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || !error.response) {
        console.warn('Close API validation: Network error during validation, allowing connection');
        // Continue - the key will be validated during sync
      } else {
        // Otherwise, wrap the error with more context
        throw new BadRequestException(
          `Failed to validate Close CRM API key: ${error.message}. ` +
          'Please check that your API key is correct and active. ' +
          'You can find your API key in Close CRM Settings > Developer > API Keys'
        );
      }
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
        apiKey: trimmedKey,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        provider: 'close',
        apiKey: trimmedKey,
      },
    });

    // Update client flag
    await this.prisma.client.update({
      where: { id: client.id },
      data: { closeConnected: true },
    });

    // If updating, trigger sync to fetch new data
    if (isUpdate) {
      try {
        await this.syncService.syncClient(client.id);
      } catch (error: any) {
        // Log error but don't fail the connection
        console.error(`Error syncing Close CRM after API key update: ${error.message}`);
      }
    }

    return {
      success: true,
      message: isUpdate ? 'Close CRM API key updated and data refreshed' : 'Close CRM connected',
    };
  }

  async connectStripe(token: string, dto: ConnectIntegrationDto) {
    // Find client by token
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const client = await this.clientsService.findById(clientData.clientId);

    const trimmedKey = dto.apiKey.trim();

    // Validate API key
    const isValid = await this.validateStripeApiKey(trimmedKey);
    if (!isValid) {
      throw new BadRequestException(
        'Invalid Stripe API key. Please use a secret (sk_) or restricted (rk_) key.',
      );
    }

    // Check if integration already exists (update vs new)
    const existingIntegration = await this.prisma.clientIntegration.findUnique({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'stripe',
        },
      },
    });

    const isUpdate = !!existingIntegration && existingIntegration.apiKey !== trimmedKey;

    // If updating (API key changed), delete all existing Stripe data
    if (isUpdate) {
      await this.prisma.payment.deleteMany({
        where: {
          clientId: client.id,
          provider: 'stripe',
        },
      });
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
        apiKey: trimmedKey,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        provider: 'stripe',
        apiKey: trimmedKey,
      },
    });

    // Update client flag
    await this.prisma.client.update({
      where: { id: client.id },
      data: { stripeConnected: true },
    });

    // If updating, trigger sync to fetch new data
    if (isUpdate) {
      try {
        await this.syncService.syncClient(client.id);
      } catch (error: any) {
        // Log error but don't fail the connection
        console.error(`Error syncing Stripe after API key update: ${error.message}`);
      }
    }

    return {
      success: true,
      message: isUpdate ? 'Stripe API key updated and data refreshed' : 'Stripe connected',
    };
  }
}

