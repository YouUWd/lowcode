import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { EngineModule } from './engine/engine.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ModulesModule } from './modules/modules.module';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [
    DatabaseModule,
    EngineModule,
    PermissionsModule,
    ModulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    console.log('[应用] 模块初始化开始...');
    
    try {
      // 检查是否需要重建数据库
      const rebuildDb = process.env.DB_REBUILD_ON_START === 'true';
      
      if (rebuildDb) {
        console.log('[应用] 🔄 检测到 DB_REBUILD_ON_START=true，将删除并重建数据库');
        await this.databaseService.deleteDatabaseFiles();
      } else {
        console.log('[应用] ℹ️  DB_REBUILD_ON_START=false，保留现有数据库');
      }
      
      // 初始化数据库 (创建表 + 插入种子数据)
      console.log('[应用] 初始化数据库...');
      await this.databaseService.initializeDatabase();
      console.log('[应用] 数据库初始化完成');
      
      console.log('[应用] 所有服务初始化完成');
    } catch (error) {
      console.error('[应用] 服务初始化失败:', error);
      throw error;
    }
  }
}
