import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EngineService } from './engine.service';
import { ModulesService } from '../modules/modules.service';
import { PermissionsService } from '../permissions/permissions.service';

@Controller()
export class EngineController {
  constructor(
    private readonly engineService: EngineService,
    private readonly modulesService: ModulesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('modules')
  getModules() {
    return this.modulesService.getAllModules();
  }

  @Get('modules/:id')
  getModuleConfig(@Param('id') id: string) {
    const config = this.modulesService.getModuleConfig(id);
    if (!config) {
      return { error: 'Module not found' };
    }
    return config;
  }

  @Get('query/:moduleId')
  async query(@Param('moduleId') moduleId: string) {
    try {
      // 获取模块配置
      const config = this.modulesService.getModuleConfig(moduleId);
      if (!config) {
        return {
          success: false,
          error: `Module not found: ${moduleId}`,
        };
      }

      console.log(`\n========== 权限拦截开始 ==========`);
      console.log(`[权限拦截] 模块ID: ${moduleId}`);

      // 获取全局权限配置
      const permissions = this.permissionsService.getGlobalPermissions();
      console.log(`[权限拦截] 全局权限节点数: ${permissions.size}`);

      // 检查权限集合是否为空
      if (permissions.size === 0) {
        console.log(`[权限拦截] ⚠️  权限集合为空，拒绝查询`);
        console.log(`========== 权限拦截结束 ==========\n`);
        return {
          success: false,
          error: '权限集合为空，无权访问任何字段',
          data: [],
          count: 0,
        };
      }

      // 应用权限过滤
      if (config.mappings) {
        console.log(`原始映射字段数: ${config.mappings.length}`);
        config.mappings = this.permissionsService.filterMappingsByPermissions(
          config.mappings,
        );
        console.log(`过滤后映射字段数: ${config.mappings.length}`);

        // 如果过滤后没有字段，也拒绝查询
        if (config.mappings.length === 0) {
          console.log(`[权限拦截] ⚠️  过滤后无可用字段，拒绝查询`);
          console.log(`========== 权限拦截结束 ==========\n`);
          return {
            success: false,
            error: '无权访问该模块的任何字段',
            data: [],
            count: 0,
          };
        }
      }

      console.log(`========== 权限拦截结束 ==========\n`);

      // 执行查询
      const result = await this.engineService.executeDynamicQuery(config);
      return {
        success: true,
        data: result,
        count: result.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
