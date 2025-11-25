import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const onboardingToken = uuidv4();

    const client = await this.prisma.client.create({
      data: {
        email: createClientDto.email,
        companyName: createClientDto.companyName,
        onboardingToken,
        calendlyConnected: false,
        closeConnected: false,
        stripeConnected: false,
      },
    });

    return client;
  }

  async findByOnboardingToken(token: string) {
    const client = await this.prisma.client.findUnique({
      where: { onboardingToken: token },
      select: {
        id: true,
        email: true,
        companyName: true,
        calendlyConnected: true,
        closeConnected: true,
        stripeConnected: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found with this onboarding token');
    }

      return {
        clientId: client.id,
        email: client.email,
        companyName: client.companyName,
        calendlyConnected: client.calendlyConnected,
        closeConnected: client.closeConnected,
        stripeConnected: client.stripeConnected,
      };
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async findAll() {
    const clients = await this.prisma.client.findMany({
      select: {
        id: true,
        email: true,
        companyName: true,
        onboardingToken: true,
        calendlyConnected: true,
        closeConnected: true,
        stripeConnected: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            integrations: true,
            bookedCalls: true,
            leads: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clients;
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.client.delete({
      where: { id },
    });

    return { success: true, message: 'Client deleted successfully' };
  }
}

