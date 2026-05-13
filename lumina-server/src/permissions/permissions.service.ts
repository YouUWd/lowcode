import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

/**
 * 权限节点格式: {entity}.{fieldName}.{operationType}
 * 例如: hr_employee_base.emp_no.READ
 * 
 * 操作类型说明：
 * - READ: 读取权限
 * - CREATE: 创建时写入权限
 * - UPDATE: 更新时写入权限
 */
export interface PermissionNode {
  entity: string;
  fieldName: string;
  operationType: 'READ' | 'CREATE' | 'UPDATE';
}

@Injectable()
export class PermissionsService {
  constructor(@Inject('CONFIG_DB') private readonly knex: Knex) {
    console.log('[权限服务] 服务已创建');
  }

  /**
   * 从数据库获取指定模块的权限节点
   * @param moduleId 模块ID，如果为空则获取所有权限
   */
  private async getPermissionsFromDatabase(moduleId?: string): Promise<Set<string>> {
    try {
      const logPrefix = moduleId ? `[权限服务] [${moduleId}]` : '[权限服务]';
      console.log(`${logPrefix} 开始从数据库查询权限节点...`);
      
      let query = this.knex('sys_permission_config').where('enabled', true);
      
      if (moduleId) {
        query = query.where('module_id', moduleId);
      }
      
      const permissions = await query.select('permission_node', 'entity', 'field_name', 'operation_type', 'module_id');

      console.log(`${logPrefix} 数据库查询完成，返回 ${permissions.length} 条记录`);
      
      if (permissions.length === 0) {
        console.warn(`${logPrefix} ⚠️  警告：数据库中没有启用的权限节点`);
        if (moduleId) {
          console.log(`${logPrefix} 检查模块 ${moduleId} 的权限配置...`);
        }
      }

      // 构建权限集合，使用简化格式: {entity}.{field}.{operation}
      const permissionSet = new Set<string>();
      permissions.forEach((p) => {
        permissionSet.add(p.permission_node);
      });

      console.log(`${logPrefix} 构建权限集合完成，共 ${permissionSet.size} 个权限节点`);
      if (permissionSet.size > 0) {
        console.log(`${logPrefix} 权限节点样本:`);
        Array.from(permissionSet).slice(0, 5).forEach(node => {
          console.log(`  - ${node}`);
        });
      }
      
      return permissionSet;
    } catch (error) {
      console.error('[权限服务] 加载权限配置失败:', error);
      return new Set();
    }
  }

  /**
   * 获取详细的权限节点信息（用于日志输出）
   */
  /**
   * 获取所有启用的详细权限节点信息
   */
  async getDetailedPermissions(): Promise<any[]> {
    try {
      const permissions = await this.knex('sys_permission_config')
        .where('enabled', true)
        .select('permission_node', 'entity', 'field_name', 'operation_type', 'module_id', 'logical_field')
        .orderBy('module_id')
        .orderBy('entity')
        .orderBy('field_name')
        .orderBy('operation_type');

      return permissions;
    } catch (error) {
      console.error('[权限服务] 获取详细权限信息失败:', error);
      return [];
    }
  }

  /**
   * 获取指定模块的详细权限节点信息（直接SQL过滤）
   * @param moduleId 模块ID
   */
  async getModuleDetailedPermissions(moduleId: string): Promise<any[]> {
    try {
      console.log(`[权限服务] 获取模块 ${moduleId} 的详细权限节点...`);
      
      const permissions = await this.knex('sys_permission_config')
        .where('enabled', true)
        .where('module_id', moduleId)
        .select('permission_node', 'entity', 'field_name', 'operation_type', 'module_id', 'logical_field')
        .orderBy('entity')
        .orderBy('field_name')
        .orderBy('operation_type');

      console.log(`[权限服务] 模块 ${moduleId} 权限节点数: ${permissions.length}`);
      
      return permissions;
    } catch (error) {
      console.error(`[权限服务] 获取模块 ${moduleId} 详细权限信息失败:`, error);
      return [];
    }
  }

  /**
   * 输出权限节点的详细日志
   */
  async logDetailedPermissions(): Promise<void> {
    const permissions = await this.getDetailedPermissions();
    
    if (permissions.length === 0) {
      console.log('[权限日志] ⚠️  没有权限节点');
      return;
    }

    console.log('\n' + '='.repeat(100));
    console.log('[权限日志] 详细权限节点信息');
    console.log('='.repeat(100));
    console.log(`总计: ${permissions.length} 个权限节点\n`);

    // 按模块分组
    const groupedByModule = new Map<string, any[]>();
    permissions.forEach((p) => {
      const moduleId = p.module_id || '未分配';
      if (!groupedByModule.has(moduleId)) {
        groupedByModule.set(moduleId, []);
      }
      groupedByModule.get(moduleId)!.push(p);
    });

    // 输出每个模块的权限
    Array.from(groupedByModule.entries()).forEach(([moduleId, perms]) => {
      console.log(`📦 模块: ${moduleId} (${perms.length} 个权限)`);
      
      // 按表分组
      const groupedByEntity = new Map<string, any[]>();
      perms.forEach((p) => {
        if (!groupedByEntity.has(p.entity)) {
          groupedByEntity.set(p.entity, []);
        }
        groupedByEntity.get(p.entity)!.push(p);
      });

      // 输出每个表的权限
      Array.from(groupedByEntity.entries()).forEach(([entity, entityPerms]) => {
        console.log(`  📋 表: ${entity}`);
        
        // 按字段分组
        const groupedByField = new Map<string, any[]>();
        entityPerms.forEach((p) => {
          const fieldKey = `${p.field_name} (${p.logical_field || 'N/A'})`;
          if (!groupedByField.has(fieldKey)) {
            groupedByField.set(fieldKey, []);
          }
          groupedByField.get(fieldKey)!.push(p);
        });

        // 输出每个字段的权限
        Array.from(groupedByField.entries()).forEach(([fieldKey, fieldPerms]) => {
          const operations = fieldPerms.map((p) => p.operation_type).join(', ');
          console.log(`    🔑 字段: ${fieldKey}`);
          console.log(`       操作: ${operations}`);
          console.log(`       节点: ${fieldPerms.map((p) => p.permission_node).join(', ')}`);
        });
      });
      console.log('');
    });

    console.log('='.repeat(100) + '\n');
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
        description: `${entity}.${fieldName} - ${operationType} 操作权限`,
      };
    });

    if (permissionRecords.length > 0) {
      await this.knex('sys_permission_config').insert(permissionRecords);
    }

    console.log(`[权限服务] 权限配置已保存到数据库`);
  }

  /**
   * 设置指定模块的权限配置
   * @param moduleId 模块ID
   * @param permissions 权限节点数组
   */
  async setModulePermissions(moduleId: string, permissions: string[]): Promise<void> {
    console.log(`[权限服务] 设置模块 ${moduleId} 权限配置，共 ${permissions.length} 个节点`);

    // 删除该模块的所有现有权限
    await this.knex('sys_permission_config')
      .where('module_id', moduleId)
      .delete();

    // 插入新权限
    const permissionRecords = permissions.map((node) => {
      const [entity, fieldName, operationType] = node.split('.');
      return {
        permission_node: node,
        entity,
        field_name: fieldName,
        operation_type: operationType,
        enabled: true,
        module_id: moduleId,
        description: `${entity}.${fieldName} - ${operationType} 操作权限`,
      };
    });

    if (permissionRecords.length > 0) {
      await this.knex('sys_permission_config').insert(permissionRecords);
      console.log(`[权限服务] 模块 ${moduleId} 权限配置已保存到数据库，共 ${permissionRecords.length} 条记录`);
    } else {
      console.log(`[权限服务] 模块 ${moduleId} 权限已清空`);
    }
  }

  /**
   * 获取指定模块的权限配置
   * @param moduleId 模块ID，如果为空则获取所有权限
   */
  async getModulePermissions(moduleId?: string): Promise<Set<string>> {
    return await this.getPermissionsFromDatabase(moduleId);
  }

  /**
   * 检查是否有权限访问某个字段
   * @param entity 表名
   * @param fieldName 字段名
   * @param operationType 操作类型 (READ | CREATE | UPDATE)
   * @param moduleId 模块ID（可选）
   */
  async hasPermission(
    entity: string,
    fieldName: string,
    operationType: 'READ' | 'CREATE' | 'UPDATE',
    moduleId?: string,
  ): Promise<boolean> {
    const permissions = await this.getPermissionsFromDatabase(moduleId);
    const permissionNode = `${entity}.${fieldName}.${operationType}`;
    return permissions.has(permissionNode);
  }

  /**
   * 根据权限过滤映射字段
   * 移除无权限的字段
   * @param mappings 字段映射数组
   * @param moduleId 模块ID（可选）
   */
  async filterMappingsByPermissions(mappings: any[], moduleId?: string): Promise<any[]> {
    const globalPermissions = await this.getPermissionsFromDatabase(moduleId);
    const logPrefix = moduleId ? `[权限过滤] [${moduleId}]` : '[权限过滤]';
    console.log(`\n${logPrefix} 权限节点数: ${globalPermissions.size}`);

    if (globalPermissions.size === 0) {
      console.log(`${logPrefix} ⚠️  权限集合为空，不允许任何字段`);
      return [];
    }

    console.log(`${logPrefix} 开始过滤 ${mappings.length} 个字段映射`);

    return mappings.filter((mapping) => {
      // 检查该映射的所有物理字段是否有READ权限
      const hasSelectPermission = mapping.physicalFields?.every((pf: any) => {
        // 权限节点格式: {entity}.{field}.READ
        const permissionNode = `${pf.entity}.${pf.field}.READ`;
        const hasPermission = globalPermissions.has(permissionNode);

        if (!hasPermission) {
          console.log(`${logPrefix} ✗ 无权限: ${permissionNode}`);
          console.log(`${logPrefix}   逻辑字段: ${mapping.logicalField}`);
          console.log(`${logPrefix}   物理字段: ${pf.entity}.${pf.field}`);
        }

        return hasPermission;
      });

      if (hasSelectPermission) {
        console.log(`${logPrefix} ✓ 有权限: ${mapping.logicalField} (${mapping.physicalFields?.map((pf: any) => `${pf.entity}.${pf.field}`).join(', ')})`);
      }

      return hasSelectPermission;
    });
  }

  /**
   * 应用权限转换
   * 对无权限的字段应用掩盖转换
   * @param mappings 字段映射数组
   * @param moduleId 模块ID（可选）
   */
  async applyPermissionTransformations(mappings: any[], moduleId?: string): Promise<any[]> {
    const globalPermissions = await this.getPermissionsFromDatabase(moduleId);
    const logPrefix = moduleId ? `[权限转换] [${moduleId}]` : '[权限转换]';
    console.log(`\n${logPrefix} 权限节点数: ${globalPermissions.size}`);

    if (globalPermissions.size === 0) {
      console.log(`${logPrefix} ⚠️  权限集合为空，所有字段将被掩盖`);
    }

    return mappings.map((mapping) => {
      const modifiedMapping = { ...mapping };

      // 检查是否有READ权限
      const hasSelectPermission = mapping.physicalFields?.every((pf: any) => {
        const permissionNode = `${pf.entity}.${pf.field}.READ`;
        return globalPermissions.has(permissionNode);
      });

      // 如果无READ权限，应用掩盖转换
      if (!hasSelectPermission && mapping.physicalFields?.length > 0) {
        console.log(
          `${logPrefix} 🔒 应用掩盖转换: ${mapping.logicalField} => MASK_SENSITIVE`,
        );
        modifiedMapping.transformer = 'MASK_SENSITIVE(${value}, "ALL")';
        modifiedMapping.transformerEnv = 'frontend';
      }

      return modifiedMapping;
    });
  }
}
