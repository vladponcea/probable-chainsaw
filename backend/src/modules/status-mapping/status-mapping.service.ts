import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import { Buffer } from 'buffer';

interface CloseOpportunityStatus {
  id: string;
  label: string;
  status_type: 'active' | 'won' | 'lost';
}

@Injectable()
export class StatusMappingService {
  private readonly logger = new Logger(StatusMappingService.name);

  constructor(private prisma: PrismaService) {}

  private createCloseClient(apiKey: string): AxiosInstance {
    const authString = Buffer.from(`${apiKey.trim()}:`).toString('base64');
    return axios.create({
      baseURL: 'https://api.close.com/api/v1',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Apply smart defaults based on status name patterns
   */
  private applySmartDefaults(statusLabel: string): boolean {
    const label = statusLabel.toLowerCase().trim();

    // Showed up patterns
    const showedUpPatterns = [
      'won',
      'closed',
      'signed',
      'follow up',
      'follow-up',
      'meeting',
      'qualified',
      'demo',
      'scheduled',
    ];

    // Didn't show up patterns
    const didntShowUpPatterns = [
      'lost',
      'no show',
      'no-show',
      'cancelled',
      'canceled',
      'declined',
      'rejected',
      'not interested',
    ];

    // Check if it matches showed up patterns
    for (const pattern of showedUpPatterns) {
      if (label.includes(pattern)) {
        return true;
      }
    }

    // Check if it matches didn't show up patterns
    for (const pattern of didntShowUpPatterns) {
      if (label.includes(pattern)) {
        return false;
      }
    }

    // Default to false (didn't show up) for unknown statuses
    return false;
  }

  /**
   * Fetch opportunity statuses from Close CRM
   */
  async fetchOpportunityStatuses(clientId: string): Promise<CloseOpportunityStatus[]> {
    const integration = await this.prisma.clientIntegration.findUnique({
      where: {
        clientId_provider: {
          clientId,
          provider: 'close',
        },
      },
    });

    if (!integration || !integration.apiKey) {
      throw new NotFoundException('Close CRM integration not found');
    }

    const client = this.createCloseClient(integration.apiKey);

    try {
      const response = await client.get('/status/opportunity/');
      return response.data?.data || [];
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch opportunity statuses: ${error.message}`,
      );
      throw new Error(
        `Failed to fetch opportunity statuses: ${error.message}`,
      );
    }
  }

  /**
   * Sync status mappings from Close CRM and apply smart defaults
   */
  async syncStatusMappings(clientId: string): Promise<any[]> {
    const statuses = await this.fetchOpportunityStatuses(clientId);

    const mappings = [];

    for (const status of statuses) {
      const showedUp = this.applySmartDefaults(status.label);
      const isDefault = true; // All synced statuses use smart defaults initially

      // Check if mapping already exists
      const existing = await this.prisma.opportunityStatusMapping.findUnique({
        where: {
          clientId_statusId: {
            clientId,
            statusId: status.id,
          },
        },
      });

      const mapping = existing
        ? await this.prisma.opportunityStatusMapping.update({
            where: {
              clientId_statusId: {
                clientId,
                statusId: status.id,
              },
            },
            data: {
              statusLabel: status.label,
              statusType: status.status_type,
              // Only update showedUp if it's still a default mapping
              // If user has customized it (isDefault = false), preserve their choice
              showedUp: existing.isDefault ? showedUp : existing.showedUp,
              // Keep isDefault as false if user customized it
              isDefault: existing.isDefault ? true : false,
            },
          })
        : await this.prisma.opportunityStatusMapping.create({
            data: {
              clientId,
              statusId: status.id,
              statusLabel: status.label,
              statusType: status.status_type,
              showedUp,
              isDefault,
            },
          });

      mappings.push(mapping);
    }

    this.logger.log(
      `Synced ${mappings.length} status mappings for client ${clientId}`,
    );
    return mappings;
  }

  /**
   * Get all status mappings for a client
   */
  async getStatusMappings(clientId: string) {
    return this.prisma.opportunityStatusMapping.findMany({
      where: { clientId },
      orderBy: { statusLabel: 'asc' },
    });
  }

  /**
   * Update a single status mapping
   */
  async updateStatusMapping(
    clientId: string,
    statusId: string,
    showedUp: boolean,
  ) {
    const mapping = await this.prisma.opportunityStatusMapping.findUnique({
      where: {
        clientId_statusId: {
          clientId,
          statusId,
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException('Status mapping not found');
    }

    return this.prisma.opportunityStatusMapping.update({
      where: {
        clientId_statusId: {
          clientId,
          statusId,
        },
      },
      data: {
        showedUp,
        isDefault: false, // Mark as user-configured
      },
    });
  }

  /**
   * Bulk update status mappings
   */
  async bulkUpdateStatusMappings(
    clientId: string,
    updates: Array<{ statusId: string; showedUp: boolean }>,
  ) {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateStatusMapping(
          clientId,
          update.statusId,
          update.showedUp,
        );
        results.push(result);
      } catch (error: any) {
        this.logger.warn(
          `Failed to update mapping for status ${update.statusId}: ${error.message}`,
        );
      }
    }

    return results;
  }
}

