import { Module } from '@nestjs/common';
import { EngineService } from './engine.service';
import { EngineController } from './engine.controller';
import { ModulesService } from '../modules/modules.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  providers: [EngineService, ModulesService],
  controllers: [EngineController],
})
export class EngineModule {}
