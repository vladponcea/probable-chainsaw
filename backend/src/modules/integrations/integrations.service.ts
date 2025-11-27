import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
  ) { }

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

    // Trim whitespace from API key
    const trimmedKey = dto.apiKey.trim();

    // Validate API key format first
    if (!trimmedKey.startsWith('api_')) {
      throw new BadRequestException(
        'Invalid Close CRM API key format. API keys should start with "api_". ' +
        'You can find your API key in Close CRM Settings > Developer > API Keys'
      );
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

    return {
      success: true,
      message: 'Close CRM connected',
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

    return {
      success: true,
      message: 'Stripe connected',
    };
  }

  async validateGhlApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    const trimmedKey = apiKey.trim();

    try {
      // GHL V2 API validation using /contacts with limit 1
      const response = await axios.get('https://services.leadconnectorhq.com/contacts/', {
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        params: { limit: 1 },
        timeout: 10000,
      });
      return response.status === 200;
    } catch (error: any) {
      console.error('GHL API validation error:', {
        status: error.response?.status,
        message: error.message,
      });

      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || !error.response) {
        console.warn('GHL API validation: Network error, allowing connection');
        return true;
      }

      return false;
    }
  }

  async connectGhl(token: string, dto: ConnectIntegrationDto) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const client = await this.clientsService.findById(clientData.clientId);

    const trimmedKey = dto.apiKey.trim();

    try {
      const isValid = await this.validateGhlApiKey(trimmedKey);
      if (!isValid) {
        throw new BadRequestException(
          'Invalid GHL API key. Please check that your API key is correct and active.'
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || !error.response) {
        console.warn('GHL API validation: Network error during validation, allowing connection');
      } else {
        throw new BadRequestException(
          `Failed to validate GHL API key: ${error.message}`
        );
      }
    }

    await this.prisma.clientIntegration.upsert({
      where: {
        clientId_provider: {
          clientId: client.id,
          provider: 'ghl',
        },
      },
      update: {
        apiKey: trimmedKey,
        updatedAt: new Date(),
      },
      create: {
        clientId: client.id,
        provider: 'ghl',
        apiKey: trimmedKey,
      },
    });

    await this.prisma.client.update({
      where: { id: client.id },
      data: { ghlConnected: true },
    });

    return {
      success: true,
      message: 'GoHighLevel connected',
    };
  }
}

