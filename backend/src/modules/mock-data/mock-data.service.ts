import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MockDataService {
  private readonly logger = new Logger(MockDataService.name);

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

  async generateMockData(token: string, count: number = 10): Promise<any> {
    try {
      // Get client by token
      const client = await this.prisma.client.findFirst({
        where: { onboardingToken: token },
        include: {
          integrations: {
            where: { provider: 'close' },
          },
        },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const integration = client.integrations[0];
      if (!integration || !integration.apiKey) {
        throw new Error('Close CRM integration not found or API key missing');
      }

      const closeClient = this.createCloseClient(integration.apiKey);

      // Get user info and opportunity statuses
      let userId: string | null = null;
      let opportunityStatuses: any[] = [];

      try {
        const userResponse = await closeClient.get('/me');
        userId = userResponse.data.id;
        this.logger.log(`Using user ID: ${userId}`);
      } catch (error: any) {
        this.logger.warn(`Failed to get user info: ${error.message}`);
      }

      try {
        const statusResponse = await closeClient.get('/status/opportunity/');
        opportunityStatuses = statusResponse.data.data || [];
        this.logger.log(`Found ${opportunityStatuses.length} opportunity statuses`);
      } catch (error: any) {
        this.logger.warn(`Failed to get opportunity statuses: ${error.message}`);
        // Use default statuses if API call fails
        opportunityStatuses = [
          { id: 'stat_unknown', status_type: 'active', label: 'Potential' },
          { id: 'stat_won', status_type: 'won', label: 'Won' },
        ];
      }

    // Mock company names and contact data
    const companies = [
      'Acme Corporation', 'TechStart Inc', 'Global Solutions', 'Digital Ventures',
      'Innovation Labs', 'Cloud Systems', 'Data Analytics Co', 'Future Tech',
      'Smart Solutions', 'NextGen Industries', 'Prime Services', 'Elite Business',
      'Advanced Systems', 'Modern Enterprises', 'Strategic Partners', 'Core Technologies',
      'Peak Performance', 'Summit Solutions', 'Apex Industries', 'Vertex Ventures',
    ];

    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const domains = ['example.com', 'testco.com', 'demo.io', 'sample.net', 'mockup.org'];

    const createdLeads = [];
    const now = new Date();

    for (let i = 0; i < Math.min(count, companies.length); i++) {
      const companyName = companies[i];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
      const phone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;

      // Create lead with contact
      try {
        const leadResponse = await closeClient.post('/lead/', {
          name: companyName,
          contacts: [
            {
              name: `${firstName} ${lastName}`,
              emails: [{ email, type: 'office' }],
              phones: [{ phone, type: 'office' }],
            },
          ],
        });

        const leadId = leadResponse.data.id;
        createdLeads.push({ leadId, companyName, email, phone, firstName, lastName });

        this.logger.log(`Created lead: ${companyName} (${leadId})`);

        // Create activities spread over the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const activityDate = new Date(now);
        activityDate.setDate(activityDate.getDate() - daysAgo);
        activityDate.setHours(Math.floor(Math.random() * 12) + 9); // Between 9 AM and 9 PM
        activityDate.setMinutes(Math.floor(Math.random() * 60));

        // Create email activity
        try {
          const emailPayload: any = {
            lead_id: leadId,
            subject: `Re: ${companyName} - Follow up`,
            body_text: `Hi ${firstName},\n\nFollowing up on our conversation. Let me know if you have any questions.\n\nBest regards`,
            direction: 'outbound',
          };
          
          if (userId) {
            emailPayload.user_id = userId;
          }
          
          // Use ISO 8601 format for date_created
          emailPayload.date_created = activityDate.toISOString();
          
          await closeClient.post('/activity/email/', emailPayload);
          this.logger.log(`Created email activity for ${companyName}`);
        } catch (error: any) {
          this.logger.warn(`Failed to create email activity: ${error.message}`);
          if (error.response?.data) {
            this.logger.warn(`Error details: ${JSON.stringify(error.response.data)}`);
          }
        }

        // Create call activity (some leads)
        if (Math.random() > 0.3) {
          const callDate = new Date(activityDate);
          callDate.setHours(callDate.getHours() + Math.floor(Math.random() * 8));
          
          try {
            const callPayload: any = {
              lead_id: leadId,
              direction: Math.random() > 0.5 ? 'outbound' : 'inbound',
              duration: Math.floor(Math.random() * 1800) + 60, // 1-30 minutes
            };
            
            if (userId) {
              callPayload.user_id = userId;
            }
            
            if (Math.random() > 0.7) {
              callPayload.voicemail = true;
            }
            
            callPayload.date_created = callDate.toISOString();
            
            await closeClient.post('/activity/call/', callPayload);
            this.logger.log(`Created call activity for ${companyName}`);
          } catch (error: any) {
            this.logger.warn(`Failed to create call activity: ${error.message}`);
            if (error.response?.data) {
              this.logger.warn(`Error details: ${JSON.stringify(error.response.data)}`);
            }
          }
        }

        // Create SMS activity (some leads)
        if (Math.random() > 0.5) {
          const smsDate = new Date(activityDate);
          smsDate.setDate(smsDate.getDate() + Math.floor(Math.random() * 7));
          
          try {
            const smsPayload: any = {
              lead_id: leadId,
              direction: Math.random() > 0.5 ? 'outbound' : 'inbound',
              text: `Hi ${firstName}, just checking in. Are you available for a quick call this week?`,
            };
            
            if (userId) {
              smsPayload.user_id = userId;
            }
            
            smsPayload.date_created = smsDate.toISOString();
            
            await closeClient.post('/activity/sms/', smsPayload);
            this.logger.log(`Created SMS activity for ${companyName}`);
          } catch (error: any) {
            this.logger.warn(`Failed to create SMS activity: ${error.message}`);
            if (error.response?.data) {
              this.logger.warn(`Error details: ${JSON.stringify(error.response.data)}`);
            }
          }
        }

        // Create opportunity (deal) for some leads
        if (Math.random() > 0.4 && opportunityStatuses.length > 0) {
          const oppDate = new Date(activityDate);
          oppDate.setDate(oppDate.getDate() + Math.floor(Math.random() * 14));
          
          try {
            // Get a random active status (prefer active over won/lost for new opportunities)
            const activeStatuses = opportunityStatuses.filter(
              (s: any) => s.status_type === 'active'
            );
            const statusesToUse = activeStatuses.length > 0 ? activeStatuses : opportunityStatuses;
            const randomStatus = statusesToUse[Math.floor(Math.random() * statusesToUse.length)];
            
            // Some opportunities should be won
            let finalStatus = randomStatus;
            if (Math.random() > 0.7) {
              const wonStatus = opportunityStatuses.find((s: any) => s.status_type === 'won');
              if (wonStatus) {
                finalStatus = wonStatus;
              }
            }
            
            const oppPayload: any = {
              lead_id: leadId,
              note: `Initial discussion with ${firstName} about ${companyName}`,
            };
            
            if (finalStatus?.id) {
              oppPayload.status_id = finalStatus.id;
            }
            
            // Add a deal value (in cents)
            const dealValue = Math.floor(Math.random() * 50000) + 5000; // $50 to $550
            oppPayload.value = dealValue * 100; // Convert to cents
            oppPayload.value_currency = 'USD';
            
            if (userId) {
              oppPayload.user_id = userId;
            }
            
            const oppResponse = await closeClient.post('/opportunity/', oppPayload);
            this.logger.log(`Created opportunity for ${companyName} with value $${dealValue}`);
            
            // If opportunity is won, update the lead status
            if (finalStatus?.status_type === 'won') {
              try {
                await closeClient.put(`/lead/${leadId}/`, {
                  status_id: finalStatus.id,
                });
              } catch (error: any) {
                this.logger.warn(`Failed to update lead status: ${error.message}`);
              }
            }
          } catch (error: any) {
            this.logger.warn(`Failed to create opportunity: ${error.message}`);
            if (error.response?.data) {
              this.logger.warn(`Error details: ${JSON.stringify(error.response.data)}`);
            }
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        this.logger.error(`Failed to create lead ${companyName}: ${error.message}`);
        if (error.response?.data) {
          this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

      return {
        success: true,
        message: `Created ${createdLeads.length} mock leads with activities`,
        leads: createdLeads,
      };
    } catch (error: any) {
      this.logger.error(`Error generating mock data: ${error.message}`);
      throw error;
    }
  }
}

