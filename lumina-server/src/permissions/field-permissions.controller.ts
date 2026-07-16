import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('admin/permission')
export class FieldPermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * 获取全局所有表及物理字段掩码权限值
   * GET /api/admin/permission/global/:roleCode
   */
  @Get('global/:roleCode')
  async getGlobalPermissions(@Param('roleCode') roleCode: string) {
    try {
      const data = await this.permissionsService.getGlobalRolePermissions(roleCode);
      return {
        code: 200,
        message: 'success',
        data,
      };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : '获取全局权限配置异常');
    }
  }

  /**
   * 获取指定角色在模块下的全部表及物理字段掩码权限值
   * GET /api/admin/permission/:moduleId/:roleCode
   */
  @Get(':moduleId/:roleCode')
  async getRoleModulePermissions(
    @Param('moduleId') moduleId: string,
    @Param('roleCode') roleCode: string,
  ) {
    try {
      const data = await this.permissionsService.getRoleModulePermissions(moduleId, roleCode);
      return {
        code: 200,
        message: 'success',
        data,
      };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : '获取权限配置异常');
    }
  }

  /**
   * 批量更新特定角色的字段掩码权限值
   * POST /api/admin/permission/field/batch
   */
  @Post('field/batch')
  async batchUpdatePermissions(
    @Body() body: { roleCode: string; tables: any[] },
  ) {
    if (!body || !body.roleCode || !body.tables) {
      throw new BadRequestException('必要参数不能为空');
    }
    try {
      await this.permissionsService.batchUpdatePermissions(body.roleCode, body.tables);
      return {
        code: 200,
        message: 'success',
        data: true,
      };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : '批量更新权限异常');
    }
  }
}
