import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class StripeSyncService {
  private readonly logger = new Logger(StripeSyncService.name);

  constructor(private prisma: PrismaService) {}

  private createStripeClient(apiKey: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.stripe.com/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async syncClientStripe(clientId: string): Promise<void> {
    try {
      // Get Stripe integration
      const integration = await this.prisma.clientIntegration.findUnique({
        where: {
          clientId_provider: {
            clientId,
            provider: 'stripe',
          },
        },
      });

      if (!integration || !integration.apiKey) {
        this.logger.warn(`No Stripe integration found for client ${clientId}`);
        return;
      }

      const client = this.createStripeClient(integration.apiKey);

      // Fetch payments
      await this.syncPayments(clientId, client);

      // Fetch subscriptions to link with payments
      await this.syncSubscriptions(clientId, client);

      this.logger.log(`Synced Stripe data for client ${clientId}`);
    } catch (error: any) {
      this.logger.error(
        `Error syncing Stripe for client ${clientId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async syncPayments(clientId: string, client: AxiosInstance) {
    // Stripe uses form-encoded data, but axios handles it automatically
    let response;
    try {
      response = await client.get('/charges', {
        params: {
          limit: 100,
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Invalid Stripe API key');
      }
      throw new Error(`Failed to fetch Stripe payments: ${error.message}`);
    }

    const charges = response.data?.data || [];

    if (!Array.isArray(charges)) {
      this.logger.warn(`Unexpected Stripe API response format for charges`);
      return;
    }

    for (const charge of charges) {
      if (!charge.id) {
        this.logger.warn(`Skipping charge without ID: ${JSON.stringify(charge)}`);
        continue;
      }
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          clientId,
          externalId: charge.id,
          provider: 'stripe',
        },
      });

      const amountCents = charge.amount || 0;
      const status = this.mapStripeStatus(charge.status, charge.refunded);

      if (existingPayment) {
        await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amountCents,
            currency: charge.currency || 'usd',
            paidAt: new Date(charge.created * 1000),
            status,
            subscriptionId: charge.invoice
              ? await this.getSubscriptionIdFromInvoice(client, charge.invoice)
              : null,
            isRecurring: !!charge.invoice,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            clientId,
            externalId: charge.id,
            provider: 'stripe',
            amountCents,
            currency: charge.currency || 'usd',
            paidAt: new Date(charge.created * 1000),
            status,
            subscriptionId: charge.invoice
              ? await this.getSubscriptionIdFromInvoice(client, charge.invoice)
              : null,
            isRecurring: !!charge.invoice,
          },
        });
      }
    }
  }

  private async syncSubscriptions(clientId: string, client: AxiosInstance) {
    let response;
    try {
      response = await client.get('/subscriptions', {
        params: {
          limit: 100,
        },
      });
    } catch (error: any) {
      // Don't fail the whole sync if subscriptions fail - just log and continue
      this.logger.warn(`Failed to fetch Stripe subscriptions: ${error.message}`);
      return;
    }

    const subscriptions = response.data?.data || [];

    // Update payments with subscription IDs
    for (const subscription of subscriptions) {
      // Fetch invoices for this subscription
      const invoicesResponse = await client.get('/invoices', {
        params: {
          subscription: subscription.id,
          limit: 100,
        },
      });

      const invoices = invoicesResponse.data?.data || [];

      for (const invoice of invoices) {
        if (invoice.charge) {
          await this.prisma.payment.updateMany({
            where: {
              clientId,
              externalId: invoice.charge,
              provider: 'stripe',
            },
            data: {
              subscriptionId: subscription.id,
              isRecurring: true,
            },
          });
        }
      }
    }
  }

  private async getSubscriptionIdFromInvoice(
    client: AxiosInstance,
    invoiceId: string,
  ): Promise<string | null> {
    try {
      const response = await client.get(`/invoices/${invoiceId}`);
      return response.data?.subscription || null;
    } catch {
      return null;
    }
  }

  private mapStripeStatus(status: string, refunded: boolean): string {
    if (refunded) return 'refunded';
    if (status === 'succeeded') return 'succeeded';
    if (status === 'failed') return 'failed';
    return 'failed';
  }
}

