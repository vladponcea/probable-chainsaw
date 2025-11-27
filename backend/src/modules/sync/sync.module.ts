import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { CalendlySyncService } from './calendly-sync.service';
import { CloseSyncService } from './close-sync.service';
import { GhlSyncService } from './ghl-sync.service';
import { StripeSyncService } from './stripe-sync.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [
    SyncService,
    CalendlySyncService,
    CloseSyncService,
    GhlSyncService,
    StripeSyncService,
  ],
  exports: [SyncService],
})
export class SyncModule { }

