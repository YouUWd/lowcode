import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { EnvironmentsModule } from './modules/environments/environments.module';
import { ReleasesModule } from './modules/releases/releases.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    EnvironmentsModule,
    ReleasesModule,
    WorkflowsModule,
  ],
})
export class AppModule {}