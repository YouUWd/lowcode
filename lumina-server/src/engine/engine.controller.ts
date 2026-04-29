import { Controller, Get, Param, Query } from '@nestjs/common';
import { EngineService, QueryOptions } from './engine.service';
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
  async getModules() {
    return this.modulesService.getAllModules();
  }

  @Get('modules/:id')
  async getModuleConfig(@Param('id') id: string) {
    const config = await this.modulesService.getModuleConfig(id);
    if (!config) {
      return { error: 'Module not found' };
    }
    return config;
  }

  @Get('query/:moduleId')
  async query(
    @Param('moduleId') moduleId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    try {
      // ========== 获取模块配置 ==========
      const config = await this.modulesService.getModuleConfig(moduleId);
      if (!config) {
        return {
          success: false,
          error: `Module not found: ${moduleId}`,
        };
      }

      console.log(`\n========== 权限拦截开始 ==========`);
      console.log(`[权限拦截] 模块ID: ${moduleId}`);

      // ========== 应用权限过滤 ==========
      const permissions = await this.permissionsService.getModulePermissions(moduleId);
      console.log(`[权限拦截] 模块权限节点数: ${permissions.size}`);
      
      // 输出详细的权限节点日志
      await this.permissionsService.logDetailedPermissions();
      
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

      // 过滤主表字段
      if (config.mappings) {
        console.log(`原始映射字段数: ${config.mappings.length}`);
        config.mappings = await this.permissionsService.filterMappingsByPermissions(
          config.mappings,
          moduleId,
        );
        console.log(`过滤后映射字段数: ${config.mappings.length}`);

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

      // ========== 构建查询选项 ==========
      const options: QueryOptions = {
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      };

      // ========== 执行查询 ==========
      const result = await this.engineService.executeDynamicQuery(config, options);
      
      return {
        success: true,
        data: result,
        count: result.length,
        pagination: options.page && options.pageSize ? {
          page: options.page,
          pageSize: options.pageSize,
          total: result.length,
        } : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
