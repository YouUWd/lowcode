import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

/**
 * 权限管理API控制器
 * 
 * 所有接口都基于模块级别，需要提供 moduleId 参数
 * 路由: /api/permissions/module/:moduleId/*
 */
@Controller('permissions/module/:moduleId')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * 获取指定模块的详细权限节点信息
   * GET /api/permissions/module/:moduleId
   * 
   * 响应:
   * {
   *   "success": true,
   *   "moduleId": "MOD-HR-ORG",
   *   "permissions": [
   *     {
   *       "permission_node": "hr_organization.org_code.READ",
   *       "entity": "hr_organization",
   *       "field_name": "org_code",
   *       "operation_type": "READ",
   *       "module_id": "MOD-HR-ORG",
   *       "logical_field": "orgCode"
   *     },
   *     ...
   *   ],
   *   "count": 10
   * }
   */
  @Get()
  async getModulePermissions(@Param('moduleId') moduleId: string) {
    try {
      console.log(`\n[权限API] 获取模块详细权限节点: ${moduleId}`);
      
      const modulePermissions = await this.permissionsService.getModuleDetailedPermissions(moduleId);
      
      console.log(`模块 ${moduleId} 权限节点数: ${modulePermissions.length}`);

      return {
        success: true,
        moduleId,
        permissions: modulePermissions,
        count: modulePermissions.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取指定模块的权限节点列表（简化格式）
   * GET /api/permissions/module/:moduleId/simple
   * 
   * 响应:
   * {
   *   "success": true,
   *   "moduleId": "MOD-HR-ORG",
   *   "permissions": [
   *     "hr_organization.org_code.READ",
   *     "hr_organization.org_name.READ",
   *     ...
   *   ],
   *   "permissionCount": 10,
   *   "status": "部分字段允许"
   * }
   */
  @Get('sets')
  async getModulePermissionsSets(@Param('moduleId') moduleId: string) {
    try {
      console.log(`\n[权限API] 获取模块权限节点: ${moduleId}`);

      const permissions = await this.permissionsService.getModulePermissions(moduleId);
      const permissionArray = Array.from(permissions);

      const status = permissionArray.length === 0 
        ? '不允许任何字段' 
        : '部分字段允许';

      console.log(`模块 ${moduleId} 权限节点数: ${permissionArray.length}, 状态: ${status}`);

      return {
        success: true,
        moduleId,
        permissions: permissionArray,
        permissionCount: permissionArray.length,
        status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 检查指定模块中是否有权限访问某个字段
   * GET /api/permissions/module/:moduleId/check?entity=hr_organization&fieldName=org_code&operationType=READ
   * 
   * operationType 可选值: READ | CREATE | UPDATE
   * 
   * 响应:
   * {
   *   "success": true,
   *   "moduleId": "MOD-HR-ORG",
   *   "permissionNode": "hr_organization.org_code.READ",
   *   "hasPermission": true
   * }
   */
  @Get('check')
  async checkModulePermission(
    @Param('moduleId') moduleId: string,
    @Query('entity') entity: string,
    @Query('fieldName') fieldName: string,
    @Query('operationType') operationType: 'READ' | 'CREATE' | 'UPDATE',
  ) {
    try {
      if (!entity || !fieldName || !operationType) {
        return {
          success: false,
          error: '缺少必要参数: entity, fieldName, operationType',
        };
      }

      const permissionNode = `${entity}.${fieldName}.${operationType}`;
      const hasPermission = await this.permissionsService.hasPermission(
        entity,
        fieldName,
        operationType,
        moduleId,
      );

      console.log(
        `[权限API] 检查模块 ${moduleId} 权限: ${permissionNode} => ${hasPermission ? '✓' : '✗'}`,
      );

      return {
        success: true,
        moduleId,
        permissionNode,
        hasPermission,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 设置指定模块的权限节点
   * POST /api/permissions/module/:moduleId
   * 
   * 请求体:
   * {
   *   "permissions": [
   *     "hr_organization.org_code.READ",
   *     "hr_organization.org_name.READ",
   *     "hr_organization.org_type.READ"
   *   ]
   * }
   * 
   * 说明:
   * - 只更新指定模块的权限
   * - 其他模块的权限不受影响
   * - 如果permissions为空数组，表示该模块不允许任何字段
   */
  @Post()
  async setModulePermissions(
    @Param('moduleId') moduleId: string,
    @Body() body: { permissions: string[] },
  ) {
    try {
      const { permissions } = body;

      if (!Array.isArray(permissions)) {
        return {
          success: false,
          error: '缺少必要参数: permissions 数组',
        };
      }

      console.log(`\n[权限API] 设置模块权限节点: ${moduleId}`);
      console.log(`权限节点数: ${permissions.length}`);
      permissions.forEach((p) => console.log(`  - ${p}`));

      // 调用服务保存模块权限
      await this.permissionsService.setModulePermissions(moduleId, permissions);

      return {
        success: true,
        moduleId,
        message: permissions.length === 0 
          ? `模块 ${moduleId} 已清空权限，不允许任何字段` 
          : `模块 ${moduleId} 成功设置 ${permissions.length} 个权限节点`,
        permissionCount: permissions.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 清空指定模块的权限节点
   * POST /api/permissions/module/:moduleId/clear
   * 
   * 说明:
   * - 清空指定模块的所有权限
   * - 该模块将不允许任何字段
   */
  @Post('clear')
  async clearModulePermissions(@Param('moduleId') moduleId: string) {
    try {
      console.log(`[权限API] 清空模块权限节点: ${moduleId}`);

      await this.permissionsService.setModulePermissions(moduleId, []);

      return {
        success: true,
        moduleId,
        message: `模块 ${moduleId} 已清空权限，不允许任何字段`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
