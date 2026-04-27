import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EngineModule } from './engine/engine.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PermissionsService } from './permissions/permissions.service';
import { KnexModule } from 'nest-knexjs';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [
    KnexModule.forRoot({
      config: {
        client: 'better-sqlite3',
        connection: {
          filename: ':memory:',
        },
        useNullAsDefault: true,
      },
    }),
    EngineModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionsService: PermissionsService,
  ) {
    this.initializeServices();
  }

  private async initializeServices() {
    // 1. 先初始化数据库 (创建表)
    await this.databaseService.initializeDatabase();
    
    // 2. 再初始化权限服务 (加载权限)
    await this.permissionsService.initialize();
  }
}
