import { Module } from '@nestjs/common';
import { EngineService } from './engine.service';
import { EngineController } from './engine.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { ModulesModule } from '../modules/modules.module';

@Module({
  imports: [PermissionsModule, ModulesModule],
  providers: [EngineService],
  controllers: [EngineController],
  exports: [EngineService],
})
export class EngineModule {}
