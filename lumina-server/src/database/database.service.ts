import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库服务
 * 
 * 管理两个独立的数据库：
 * 1. configDb (配置数据库): 存储模块配置、字段映射、权限配置等系统配置数据
 * 2. businessDb (业务数据库): 存储 HR 业务数据（组织、员工、薪酬等）
 * 
 * 初始化顺序：
 * 1. 创建 configDb 表结构
 * 2. 创建 businessDb 表结构
 * 3. 插入 configDb 样本数据
 * 4. 插入 businessDb 样本数据
 */
@Injectable()
export class DatabaseService {
  constructor(
    @Inject('CONFIG_DB') private readonly configDb: Knex,
    @Inject('BUSINESS_DB') private readonly businessDb: Knex,
  ) {
    console.log('[数据库服务] 服务已创建');
    console.log('[数据库服务] - configDb: 配置数据库 (模块、字段、权限)');
    console.log('[数据库服务] - businessDb: 业务数据库 (HR 数据)');
  }

  /**
   * 删除数据库文件（仅适用于 SQLite）
   */
  async deleteDatabaseFiles() {
    console.log('[数据库服务] 检查并删除现有数据库文件...');
    
    const dataDir = path.join(process.cwd(), 'data');
    const dbFiles = ['business.db', 'config.db'];
    
    let deletedCount = 0;
    
    for (const dbFile of dbFiles) {
      const filePath = path.join(dataDir, dbFile);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[数据库服务] ✓ 已删除: ${dbFile}`);
          deletedCount++;
        } catch (error) {
          console.error(`[数据库服务] ✗ 删除失败: ${dbFile}`, error);
        }
      } else {
        console.log(`[数据库服务] - 文件不存在: ${dbFile}`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[数据库服务] 共删除 ${deletedCount} 个数据库文件`);
    } else {
      console.log(`[数据库服务] 没有需要删除的数据库文件`);
    }
  }

  /**
   * 数据库初始化主流程
   * 按照以下顺序执行：
   * 1. 初始化 configDb 表结构
   * 2. 初始化 businessDb 表结构
   * 3. 初始化 configDb 样本数据
   * 4. 初始化 businessDb 样本数据
   */
  async initializeDatabase() {
    console.log('[数据库服务] ========== 开始初始化数据库 ==========');
    
    // 步骤 1: 初始化配置数据库表结构
    console.log('[数据库服务] 步骤 1/4: 初始化配置数据库表结构...');
    await this.createConfigTables();
    console.log('[数据库服务] ✓ 配置数据库表结构创建完成');
    
    // 步骤 2: 初始化业务数据库表结构
    console.log('[数据库服务] 步骤 2/4: 初始化业务数据库表结构...');
    await this.createBusinessTables();
    console.log('[数据库服务] ✓ 业务数据库表结构创建完成');
    
    // 步骤 3: 初始化配置数据库样本数据
    console.log('[数据库服务] 步骤 3/4: 初始化配置数据库样本数据...');
    await this.seedConfigData();
    console.log('[数据库服务] ✓ 配置数据库样本数据插入完成');
    
    // 步骤 4: 初始化业务数据库样本数据
    console.log('[数据库服务] 步骤 4/4: 初始化业务数据库样本数据...');
    await this.seedBusinessData();
    console.log('[数据库服务] ✓ 业务数据库样本数据插入完成');
    
    console.log('[数据库服务] ========== 所有数据库初始化完成 ==========\n');
  }

  /**
   * 创建配置数据库表结构
   * 
   * 包含以下表：
   * - sys_permission_config: 权限配置表
   * - sys_module: 模块基本信息表
   * - sys_module_entity: 模块关联表信息
   * - sys_module_field: 模块字段配置表（包含 source_mapping JSON 字段）
   */
  private async createConfigTables() {
    
    if (!(await this.configDb.schema.hasTable('sys_module'))) {
      await this.configDb.schema.createTable('sys_module', (table) => {
        table.increments('id').primary();
        table.string('module_id', 50).unique().notNullable();
        table.string('module_name', 100).notNullable();
        table.string('module_desc', 500).nullable();
        table.string('primary_entity', 100).notNullable();
        table.string('primary_entity_desc', 500).nullable();
        table.integer('record_count').defaultTo(0);
        table.boolean('is_active').defaultTo(true);
        table.integer('sort_order').defaultTo(0);
        table.timestamps(true, true);
      });
    }

    if (!(await this.configDb.schema.hasTable('sys_module_entity'))) {
      await this.configDb.schema.createTable('sys_module_entity', (table) => {
        table.increments('id').primary();
        table.string('module_id', 50).notNullable();
        table.string('entity_id', 50).notNullable();
        table.string('entity_name', 100).notNullable();
        table.string('entity_desc', 500).nullable();
        table.string('join_left_field', 100).notNullable();
        table.string('join_right_field', 100).notNullable();
        table.string('entity_status', 50).defaultTo('正常');
        table.string('relation_type', 10).defaultTo('1:1');
        table.integer('sort_order').defaultTo(0);
        table.timestamps(true, true);
      });
    }

    if (!(await this.configDb.schema.hasTable('sys_module_field'))) {
      await this.configDb.schema.createTable('sys_module_field', (table) => {
        table.increments('id').primary();
        table.string('module_id', 50).notNullable();
        table.string('field_id', 100).notNullable();
        table.string('display_name', 100).notNullable();
        table.string('logical_field', 100).notNullable();
        table.text('source_mapping').nullable(); // JSON 数组: [{ entity, field, sort_order }]
        table.string('transformer', 500).nullable();
        table.string('transformer_env', 50).defaultTo('none');
        table.string('render_icon', 100).nullable();
        table.string('render_type', 50).nullable();
        table.integer('sort_order').defaultTo(0);
        table.boolean('is_visible').defaultTo(true);
        table.timestamps(true, true);
      });
    }

    if (!(await this.configDb.schema.hasTable('sys_permission_config'))) {
      await this.configDb.schema.createTable('sys_permission_config', (table) => {
        table.increments('id').primary();
        table.string('permission_node');
        table.string('entity');
        table.string('field_name');
        table.string('operation_type');
        table.string('description').nullable();
        table.boolean('enabled').defaultTo(true);
        table.string('module_id', 50).nullable();
        table.string('logical_field', 100).nullable();
        table.timestamps(true, true);
        // 复合唯一索引：module_id + permission_node
        table.unique(['module_id', 'permission_node']);
      });
    }

    // --- 审批流核心引擎表 ---
    
    // 1. 审批流模板定义表
    if (!(await this.configDb.schema.hasTable('sys_approval_chain_config'))) {
      await this.configDb.schema.createTable('sys_approval_chain_config', (table) => {
        table.increments('id').primary();
        table.string('module_id', 50).notNullable().comment('所属模块ID (对应 sys_module.module_id)');
        table.integer('up_id').defaultTo(0).comment('上一个节点ID (双向链表)');
        table.integer('next_id').defaultTo(0).comment('下一个节点ID (双向链表)');
        table.string('node_name', 100).notNullable().comment('节点名称');
        table.enum('node_type', ['user_task', 'parallel_group']).defaultTo('user_task').comment('节点类型: 普通任务或并行组');
        table.string('approval_rule', 50).nullable().comment('审批规则 (0:指定, 1:角色或签, 2:角色全签, 3:会签百分比)');
        table.string('role_target', 50).nullable().comment('目标角色(普通任务使用)');
        table.integer('role_approval_percent').nullable().comment('会签百分比');
        table.json('parallel_branches').nullable().comment('并行分支定义集合 [{branch_id, name, role_target}]');
        table.string('re_approval_strategy', 50).defaultTo('strict_reset').comment('重审策略: strict_reset, smart_rollback, ignore');
        table.string('condition', 500).nullable().comment('生效条件表达式(支持变量解析)');
        table.boolean('is_jump').defaultTo(false).comment('是否允许紧急跳过');
        table.timestamps(true, true);
      });
    }

    // 2. 统一流程实例表 (承载所有业务的草稿与宏观状态)
    if (!(await this.configDb.schema.hasTable('sys_approval_instance'))) {
      await this.configDb.schema.createTable('sys_approval_instance', (table) => {
        table.string('business_no', 50).primary().comment('统一流水号 (PK, 跨越业务与引擎的唯一凭证)');
        table.string('module_id', 50).notNullable().comment('绑定的业务模块ID');
        table.string('title', 255).notNullable().comment('统一待办标题');
        table.string('target_entity', 100).nullable().comment('要操作的具体物理表名 (可选，提供上下文)');
        table.string('target_record_id', 100).nullable().comment('要修改的真实业务主键 (新增时可为空)');
        table.enum('action_type', ['INSERT', 'UPDATE', 'DELETE', 'CUSTOM']).defaultTo('CUSTOM').comment('业务意图');
        table.string('reason', 500).nullable().comment('申请事由/备注说明 (与实际业务数据隔离)');
        table.json('payload').nullable().comment('【核心】业务数据载荷(仅包含真实的业务字段变更)');
        table.integer('macro_status').defaultTo(1).comment('宏观状态: 1(审批中), 99(生效), -99(作废)');
        table.string('submitter_id', 50).notNullable().comment('发起人标识');
        table.timestamps(true, true);
      });
    }

    // 3. 审批流运行实例任务表 (微观流转追踪)
    if (!(await this.configDb.schema.hasTable('sys_approval_task'))) {
      await this.configDb.schema.createTable('sys_approval_task', (table) => {
        table.increments('id').primary();
        table.string('business_no', 50).notNullable().comment('关联 sys_approval_instance.business_no');
        table.integer('node_id').notNullable().comment('关联 sys_approval_chain_config 节点ID');
        table.string('branch_id', 50).nullable().comment('如果是并行组，记录对应的分支ID');
        table.enum('status', ['PENDING', 'PASS', 'REJECT', 'INVALIDATED']).defaultTo('PENDING').comment('任务状态');
        table.string('approvers_list', 1000).nullable().comment('已审批人员工号(逗号分隔)记录，用于会签人数判定');
        table.timestamps(true, true);
        
        table.index(['business_no', 'node_id']);
        table.foreign('business_no').references('business_no').inTable('sys_approval_instance').onDelete('CASCADE');
      });
    }

    // 4. 审批流执行日志表 (持久化流转轨迹)
    if (!(await this.configDb.schema.hasTable('sys_approval_log'))) {
      await this.configDb.schema.createTable('sys_approval_log', (table) => {
        table.increments('id').primary();
        table.string('business_no', 50).notNullable().comment('关联 sys_approval_instance.business_no');
        table.string('action_type', 50).notNullable().comment('动作: submit, pass, reject, system_reset');
        table.string('operator', 100).notNullable().comment('操作人 (如果是自动触发则为 System/Engine)');
        table.string('node_name', 100).nullable().comment('发生动作的关联节点名称');
        table.string('comment', 500).nullable().comment('审批意见或系统说明');
        table.boolean('is_system').defaultTo(false).comment('是否为引擎或系统自动触发的动作');
        table.timestamps(true, true);
        
        table.index('business_no');
      });
    }
  }

  /**
   * 创建业务数据库表结构
   * 
   * 学生管理系统包含以下表：
   * - class: 班级表
   * - teacher: 教师表
   * - student: 学生表（主表）
   * - course: 课程表
   * - score: 成绩表（1:N 关系）
   * - department: 部门表（用于教师档案模块）
   * - enrollment: 选课表（用于学生课程模块）
   */
  private async createBusinessTables() {
    if (!(await this.businessDb.schema.hasTable('customer_profiles'))) {
      await this.businessDb.schema.createTable('customer_profiles', (table) => {
        table.increments('id').primary();
        table.string('name', 128).notNullable().unique();
        table.string('level', 32).defaultTo('REGULAR');
        table.string('contact_phone', 32);
      });
    }

    if (!(await this.businessDb.schema.hasTable('orders'))) {
      await this.businessDb.schema.createTable('orders', (table) => {
        table.increments('id').primary();
        table.string('order_no', 64).notNullable();
        table.string('customer', 128).references('name').inTable('customer_profiles');
        table.decimal('amount', 12, 2).defaultTo(0);
        table.string('status', 32).defaultTo('PENDING');
        table.string('remark', 512);
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('order_items'))) {
      await this.businessDb.schema.createTable('order_items', (table) => {
        table.increments('id').primary();
        table.integer('order_id').notNullable().references('id').inTable('orders');
        table.string('product_name', 128).notNullable();
        table.integer('qty').defaultTo(1);
        table.decimal('price', 10, 2).defaultTo(0);
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('tags'))) {
      await this.businessDb.schema.createTable('tags', (table) => {
        table.increments('id').primary();
        table.string('name', 64).notNullable();
      });
    }

    if (!(await this.businessDb.schema.hasTable('order_tags'))) {
      await this.businessDb.schema.createTable('order_tags', (table) => {
        table.increments('id').primary();
        table.integer('order_id').notNullable().references('id').inTable('orders');
        table.integer('tag_id').notNullable().references('id').inTable('tags');
      });
    }
  }

  private async seedConfigData() {
    try {
      console.log('[数据库服务] 开始清空并重新插入配置数据...');
      await this.configDb('sys_permission_config').del();
      await this.configDb('sys_module_field').del();
      await this.configDb('sys_module_entity').del();
      await this.configDb('sys_module').del();
      await this.configDb('sys_approval_chain_config').del();
      await this.configDb('sys_approval_task').del();
      await this.configDb('sys_approval_log').del();
      await this.configDb('sys_approval_instance').del();
      
      // 插入基础模块信息 (仅为了保证不报错)
      await this.configDb('sys_module').insert([
        {
          id: 1,
          module_id: 'order',
          module_name: '订单模块',
          module_desc: '包含订单主表、明细表',
          primary_entity: 'orders',
          primary_entity_desc: '订单主表',
          record_count: 3,
          is_active: 1,
          sort_order: 1,
        }
      ]);

      // ========== 显式插入 ER 图元数据 ==========
      await this.configDb('er_relation_meta').del();
      await this.configDb('er_field_meta').del();
      await this.configDb('er_table_meta').del();

      await this.configDb('er_table_meta').insert([
        { id: 1, table_name: 'orders', display_name: '订单主表', primary_column: 'id' },
        { id: 2, table_name: 'order_items', display_name: '订单明细表', primary_column: 'id' },
        { id: 3, table_name: 'customer_profiles', display_name: '客户扩展表', primary_column: 'id' },
        { id: 4, table_name: 'tags', display_name: '标签表', primary_column: 'id' },
        { id: 5, table_name: 'order_tags', display_name: '订单标签表', primary_column: 'id' }
      ]);

      await this.configDb('er_field_meta').insert([
        { id: 1, table_id: 1, column_name: 'id', label: '编号', data_type: 'NUMBER' },
        { id: 2, table_id: 1, column_name: 'order_no', label: '订单号', data_type: 'STRING' },
        { id: 3, table_id: 1, column_name: 'customer', label: '客户名', data_type: 'STRING' },
        { id: 4, table_id: 1, column_name: 'amount', label: '金额', data_type: 'DECIMAL' },
        { id: 5, table_id: 1, column_name: 'status', label: '状态', data_type: 'STRING' },
        { id: 6, table_id: 1, column_name: 'remark', label: '备注', data_type: 'STRING' },
        { id: 7, table_id: 1, column_name: 'created_at', label: '创建时间', data_type: 'DATETIME' },
        { id: 8, table_id: 1, column_name: 'updated_at', label: '更新时间', data_type: 'DATETIME' },
        { id: 9, table_id: 2, column_name: 'id', label: '编号', data_type: 'NUMBER' },
        { id: 10, table_id: 2, column_name: 'order_id', label: '订单ID', data_type: 'NUMBER' },
        { id: 11, table_id: 2, column_name: 'product_name', label: '商品名称', data_type: 'STRING' },
        { id: 12, table_id: 2, column_name: 'qty', label: '数量', data_type: 'NUMBER' },
        { id: 13, table_id: 2, column_name: 'price', label: '单价', data_type: 'DECIMAL' },
        { id: 14, table_id: 2, column_name: 'created_at', label: '创建时间', data_type: 'DATETIME' },
        { id: 15, table_id: 3, column_name: 'id', label: '档案ID', data_type: 'NUMBER' },
        { id: 16, table_id: 3, column_name: 'name', label: '客户姓名', data_type: 'STRING' },
        { id: 17, table_id: 3, column_name: 'level', label: '客户级别', data_type: 'STRING' },
        { id: 18, table_id: 3, column_name: 'contact_phone', label: '联系电话', data_type: 'STRING' },
        { id: 19, table_id: 4, column_name: 'id', label: '标签ID', data_type: 'NUMBER' },
        { id: 20, table_id: 4, column_name: 'name', label: '标签名称', data_type: 'STRING' },
        { id: 21, table_id: 5, column_name: 'id', label: '主键ID', data_type: 'NUMBER' },
        { id: 22, table_id: 5, column_name: 'order_id', label: '订单ID', data_type: 'NUMBER' },
        { id: 23, table_id: 5, column_name: 'tag_id', label: '标签ID', data_type: 'NUMBER' }
      ]);

      await this.configDb('er_relation_meta').insert([
        { id: 1, name: 'orders->order_items', source_table: 'orders', source_column: 'id', target_table: 'order_items', target_column: 'order_id', relation_type: '1:N' },
        { id: 2, name: 'orders->customer_profiles', source_table: 'orders', source_column: 'customer', target_table: 'customer_profiles', target_column: 'name', relation_type: 'N:1' },
        { id: 3, name: 'orders->order_tags', source_table: 'orders', source_column: 'id', target_table: 'order_tags', target_column: 'order_id', relation_type: '1:N' },
        { id: 4, name: 'tags->order_tags', source_table: 'tags', source_column: 'id', target_table: 'order_tags', target_column: 'tag_id', relation_type: '1:N' }
      ]);
      console.log('[数据库服务] 配置数据与 ER 元数据插入完成');
    } catch (error) {
      console.error('[数据库服务] 配置数据插入失败:', error);
      throw error;
    }
  }

  private async seedBusinessData() {
    try {
      console.log('[数据库服务] 开始清空并重新插入业务数据...');
      
      await this.businessDb('order_tags').del();
      await this.businessDb('tags').del();
      await this.businessDb('order_items').del();
      await this.businessDb('orders').del();
      await this.businessDb('customer_profiles').del();

      console.log('[数据库服务] 插入业务数据...');

      await this.businessDb('customer_profiles').insert([
        { id: 1, name: '张三', level: 'VIP', contact_phone: '13800138000' },
        { id: 2, name: '李四', level: 'GOLD', contact_phone: '13900139000' },
        { id: 3, name: '王五', level: 'REGULAR', contact_phone: '13700137000' },
      ]);

      await this.businessDb('tags').insert([
        { id: 1, name: 'VIP' },
        { id: 2, name: '加急' },
        { id: 3, name: '退货' },
        { id: 4, name: '特价' },
        { id: 5, name: '赠品' },
      ]);

      await this.businessDb('orders').insert([
        { id: 1, order_no: 'ORD-20240101-001', customer: '张三', amount: 1500.00, status: 'PAID', remark: '首单客户' },
        { id: 2, order_no: 'ORD-20240101-002', customer: '李四', amount: 3200.50, status: 'SHIPPED', remark: '加急' },
        { id: 3, order_no: 'ORD-20240102-003', customer: '王五', amount: 800.00, status: 'PENDING', remark: null },
      ]);

      await this.businessDb('order_items').insert([
        { id: 1, order_id: 1, product_name: '鼠标', qty: 1, price: 500.00 },
        { id: 2, order_id: 1, product_name: '键盘', qty: 1, price: 1000.00 },
        { id: 3, order_id: 2, product_name: '笔记本', qty: 1, price: 3200.50 },
        { id: 4, order_id: 3, product_name: '鼠标', qty: 2, price: 150.00 },
        { id: 5, order_id: 3, product_name: '鼠标垫', qty: 1, price: 50.00 },
      ]);

      await this.businessDb('order_tags').insert([
        { id: 1, order_id: 1, tag_id: 1 },
        { id: 2, order_id: 1, tag_id: 4 },
        { id: 3, order_id: 2, tag_id: 2 },
        { id: 4, order_id: 3, tag_id: 3 },
        { id: 5, order_id: 3, tag_id: 5 },
      ]);
      
      console.log('[数据库服务] 业务数据插入完成');
    } catch (error) {
      console.error('[数据库服务] 业务数据插入失败:', error);
      throw error;
    }
  }
  }
}
