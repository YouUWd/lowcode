import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';

/**
 * 权限节点格式: {entity}.{fieldName}.{operationType}
 * 例如: hr_employee_base.emp_no.SELECT
 */
export interface PermissionNode {
  entity: string;
  fieldName: string;
  operationType: 'SELECT' | 'UPDATE' | 'WRITE';
}

@Injectable()
export class PermissionsService {
  // 内存缓存权限集合
  private globalPermissions: Set<string> = new Set();
  private initialized = false;

  constructor(@InjectConnection() private readonly knex: Knex) {
    // 不在构造函数中加载，等待显式初始化
  }

  /**
   * 初始化权限服务 (在数据库初始化后调用)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.loadPermissionsFromDatabase();
    this.initialized = true;
  }

  /**
   * 从数据库加载权限配置
   */
  private async loadPermissionsFromDatabase(): Promise<void> {
    try {
      console.log('[权限服务] 从数据库加载权限配置');
      const permissions = await this.knex('sys_permission_config')
        .where('enabled', true)
        .select('permission_node');

      this.globalPermissions.clear();
      permissions.forEach((p) => {
        this.globalPermissions.add(p.permission_node);
      });

      console.log(`[权限服务] 加载了 ${this.globalPermissions.size} 个权限节点`);
    } catch (error) {
      console.error('[权限服务] 加载权限配置失败:', error);
      // 初始化为空集合，默认不允许任何字段
      this.globalPermissions = new Set();
    }
  }

  /**
   * 设置全局权限配置
   * @param permissions 权限节点集合
   */
  async setGlobalPermissions(permissions: Set<string>): Promise<void> {
    console.log(`[权限服务] 设置全局权限配置，共 ${permissions.size} 个节点`);

    // 清空数据库中的权限
    await this.knex('sys_permission_config').delete();

    // 插入新权限
    const permissionRecords = Array.from(permissions).map((node) => {
      const [entity, fieldName, operationType] = node.split('.');
      return {
        permission_node: node,
        entity,
        field_name: fieldName,
        operation_type: operationType,
        enabled: true,
      };
    });

    if (permissionRecords.length > 0) {
      await this.knex('sys_permission_config').insert(permissionRecords);
    }

    // 更新内存缓存
    this.globalPermissions = new Set(permissions);
    console.log(`[权限服务] 权限配置已保存到数据库`);
  }

  /**
   * 获取全局权限配置
   */
  getGlobalPermissions(): Set<string> {
    return this.globalPermissions;
  }

  /**
   * 检查是否有权限访问某个字段
   * @param entity 表名
   * @param fieldName 字段名
   * @param operationType 操作类型
   */
  hasPermission(
    entity: string,
    fieldName: string,
    operationType: 'SELECT' | 'UPDATE' | 'WRITE',
  ): boolean {
    // 默认不允许任何操作，需要显式配置权限
    const permissionNode = `${entity}.${fieldName}.${operationType}`;
    return this.globalPermissions.has(permissionNode);
  }

  /**
   * 根据权限过滤映射字段
   * 移除无权限的字段
   * @param mappings 字段映射数组
   */
  filterMappingsByPermissions(mappings: any[]): any[] {
    console.log(`\n[权限过滤] 全局权限节点数: ${this.globalPermissions.size}`);

    if (this.globalPermissions.size === 0) {
      console.log(`  ⚠️  权限集合为空，不允许任何字段`);
      return [];
    }

    return mappings.filter((mapping) => {
      // 检查该映射的所有物理字段是否有SELECT权限
      const hasSelectPermission = mapping.physicalFields?.every((pf: any) => {
        const permissionNode = `${pf.entity}.${pf.name}.SELECT`;
        const hasPermission = this.globalPermissions.has(permissionNode);

        if (!hasPermission) {
          console.log(`  ✗ 无权限: ${permissionNode} - 字段 ${mapping.logicalField} 将被过滤`);
        }

        return hasPermission;
      });

      if (hasSelectPermission) {
        console.log(`  ✓ 有权限: ${mapping.logicalField}`);
      }

      return hasSelectPermission;
    });
  }

  /**
   * 应用权限转换
   * 对无权限的字段应用掩盖转换
   * @param mappings 字段映射数组
   */
  applyPermissionTransformations(mappings: any[]): any[] {
    console.log(`\n[权限转换] 应用权限转换，全局权限节点数: ${this.globalPermissions.size}`);

    if (this.globalPermissions.size === 0) {
      console.log(`  ⚠️  权限集合为空，所有字段将被掩盖`);
    }

    return mappings.map((mapping) => {
      const modifiedMapping = { ...mapping };

      // 检查是否有SELECT权限
      const hasSelectPermission = mapping.physicalFields?.every((pf: any) => {
        const permissionNode = `${pf.entity}.${pf.name}.SELECT`;
        return this.globalPermissions.has(permissionNode);
      });

      // 如果无SELECT权限，应用掩盖转换
      if (!hasSelectPermission && mapping.physicalFields?.length > 0) {
        console.log(
          `  🔒 应用掩盖转换: ${mapping.logicalField} => MASK_SENSITIVE`,
        );
        modifiedMapping.transformer = 'MASK_SENSITIVE(${value}, "ALL")';
        modifiedMapping.transformerEnv = 'frontend';
      }

      return modifiedMapping;
    });
  }
}
