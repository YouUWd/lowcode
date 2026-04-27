import { Controller, Post, Get, Body } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

/**
 * 权限管理API控制器
 * 提供全局权限配置接口
 */
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * 设置全局权限配置
   * POST /api/permissions/config
   * 
   * 请求体:
   * {
   *   "permissions": [
   *     "hr_employee_base.emp_no.SELECT",
   *     "hr_employee_base.first_name.SELECT",
   *     "hr_payroll_result.net_amount.SELECT"
   *   ]
   * }
   * 
   * 说明: 
   * - 默认不允许任何字段
   * - 需要显式配置权限节点才能访问字段
   * - 如果permissions为空数组，表示不允许任何字段
   */
  @Post('config')
  async setPermissions(@Body() body: { permissions: string[] }) {
    try {
      const { permissions } = body;

      if (!Array.isArray(permissions)) {
        return {
          success: false,
          error: '缺少必要参数: permissions 数组',
        };
      }

      console.log(`\n[权限API] 设置全局权限配置`);
      console.log(`权限节点数: ${permissions.length}`);
      permissions.forEach((p) => console.log(`  - ${p}`));

      // 将权限数组转换为Set并保存
      const permissionSet = new Set(permissions);
      await this.permissionsService.setGlobalPermissions(permissionSet);

      return {
        success: true,
        message: permissions.length === 0 
          ? '已清空权限配置，不允许任何字段' 
          : `成功设置 ${permissions.length} 个权限节点`,
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
   * 获取全局权限配置
   * GET /api/permissions/config
   * 
   * 响应:
   * {
   *   "success": true,
   *   "permissions": [
   *     "hr_employee_base.emp_no.SELECT",
   *     ...
   *   ],
   *   "permissionCount": 15,
   *   "status": "不允许任何字段" 或 "部分字段允许"
   * }
   */
  @Get('config')
  getPermissions() {
    try {
      console.log(`\n[权限API] 获取全局权限配置`);

      const permissions = this.permissionsService.getGlobalPermissions();
      const permissionArray = Array.from(permissions);

      const status = permissionArray.length === 0 
        ? '不允许任何字段' 
        : '部分字段允许';

      console.log(`权限节点数: ${permissionArray.length}, 状态: ${status}`);

      return {
        success: true,
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
   * 检查是否有权限访问某个字段
   * GET /api/permissions/check?entity=hr_employee_base&fieldName=emp_no&operationType=SELECT
   * 
   * 响应:
   * {
   *   "success": true,
   *   "permissionNode": "hr_employee_base.emp_no.SELECT",
   *   "hasPermission": true
   * }
   */
  @Get('check')
  checkPermission(
    entity: string,
    fieldName: string,
    operationType: 'SELECT' | 'UPDATE' | 'WRITE',
  ) {
    try {
      if (!entity || !fieldName || !operationType) {
        return {
          success: false,
          error: '缺少必要参数: entity, fieldName, operationType',
        };
      }

      const permissionNode = `${entity}.${fieldName}.${operationType}`;
      const hasPermission = this.permissionsService.hasPermission(
        entity,
        fieldName,
        operationType,
      );

      console.log(
        `[权限API] 检查权限: ${permissionNode} => ${hasPermission ? '✓' : '✗'}`,
      );

      return {
        success: true,
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
   * 清空权限配置 (不允许任何字段)
   * POST /api/permissions/clear
   */
  @Post('clear')
  async clearPermissions() {
    try {
      console.log(`[权限API] 清空权限配置，不允许任何字段`);

      await this.permissionsService.setGlobalPermissions(new Set());

      return {
        success: true,
        message: '已清空权限配置，不允许任何字段',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
