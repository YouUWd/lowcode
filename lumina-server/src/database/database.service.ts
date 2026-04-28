import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

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
   * - sys_module_field: 模块字段配置表
   * - sys_module_field_source: 字段物理源映射表
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
        table.string('transformer', 500).nullable();
        table.string('transformer_env', 50).defaultTo('none');
        table.string('render_icon', 100).nullable();
        table.string('render_type', 50).nullable();
        table.integer('sort_order').defaultTo(0);
        table.boolean('is_visible').defaultTo(true);
        table.timestamps(true, true);
      });
    }

    if (!(await this.configDb.schema.hasTable('sys_module_field_source'))) {
      await this.configDb.schema.createTable('sys_module_field_source', (table) => {
        table.increments('id').primary();
        table.string('module_id', 50).notNullable();
        table.string('logical_field', 100).notNullable();
        table.string('source_entity', 100).notNullable();
        table.string('source_field', 100).notNullable();
        table.integer('sort_order').defaultTo(0);
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
  }

  /**
   * 创建业务数据库表结构
   * 
   * 包含以下表：
   * - hr_organization: 组织架构表
   * - sys_user: 用户表
   * - hr_employee_base: 员工基础信息表
   * - hr_emp_job: 员工任职信息表
   * - hr_emp_personal: 员工隐私信息表
   * - hr_payroll_result: 薪酬结果表
   * - hr_salary_structure: 薪资结构表
   * - hr_social_security_record: 社保记录表
   * - hr_tax_record: 个税记录表
   * - sys_operation_log: 操作日志表
   */
  private async createBusinessTables() {
    if (!(await this.businessDb.schema.hasTable('hr_organization'))) {
      await this.businessDb.schema.createTable('hr_organization', (table) => {
        table.increments('id').primary();
        table.string('org_code').unique();
        table.string('org_name');
        table.string('org_type');
        table.integer('headcount').defaultTo(0);
        table.integer('max_headcount').defaultTo(100);
        table.date('effective_date');
        table.string('ancestor_code').nullable();
        table.integer('manager_id').nullable();
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('sys_user'))) {
      await this.businessDb.schema.createTable('sys_user', (table) => {
        table.increments('id').primary();
        table.string('username').unique();
        table.string('real_name');
        table.string('emp_no');
        table.integer('dept_id');
        table.string('status');
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_employee_base'))) {
      await this.businessDb.schema.createTable('hr_employee_base', (table) => {
        table.increments('id').primary();
        table.string('emp_no').unique();
        table.string('first_name');
        table.string('last_name');
        table.string('full_name');
        table.integer('dept_id');
        table.string('status').defaultTo('1');
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_emp_job'))) {
      await this.businessDb.schema.createTable('hr_emp_job', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.integer('dept_id');
        table.string('job_title');
        table.string('emp_type');
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_emp_personal'))) {
      await this.businessDb.schema.createTable('hr_emp_personal', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.string('id_card_no');
        table.string('bank_account').nullable();
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_payroll_result'))) {
      await this.businessDb.schema.createTable('hr_payroll_result', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.integer('payroll_year');
        table.integer('payroll_month');
        table.decimal('gross_amount', 10, 2);
        table.decimal('net_amount', 10, 2);
        table.string('payment_status').defaultTo('0');
        table.integer('structure_id').nullable();
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_salary_structure'))) {
      await this.businessDb.schema.createTable('hr_salary_structure', (table) => {
        table.increments('id').primary();
        table.string('structure_code');
        table.decimal('base_salary', 10, 2);
        table.decimal('allowance', 10, 2).defaultTo(0);
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_social_security_record'))) {
      await this.businessDb.schema.createTable('hr_social_security_record', (table) => {
        table.increments('id').primary();
        table.integer('result_id');
        table.decimal('total_personal_deduct', 10, 2);
        table.decimal('total_company_deduct', 10, 2);
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('hr_tax_record'))) {
      await this.businessDb.schema.createTable('hr_tax_record', (table) => {
        table.increments('id').primary();
        table.integer('result_id');
        table.decimal('tax_amount', 10, 2);
        table.decimal('taxable_income', 10, 2);
        table.timestamps(true, true);
      });
    }

    if (!(await this.businessDb.schema.hasTable('sys_operation_log'))) {
      await this.businessDb.schema.createTable('sys_operation_log', (table) => {
        table.increments('id').primary();
        table.string('operator_name');
        table.string('action_type');
        table.string('ip_address').nullable();
        table.timestamps(true, true);
      });
    }
  }

  /**
   * 插入配置数据库样本数据
   * 
   * 每次启动都会清空并重新插入数据（in-memory 模式）
   * 
   * 插入顺序：
   * 1. 模块基本信息 (sys_module): 4 个模块
   * 2. 模块关联表 (sys_module_entity): 13 条记录
   * 3. 模块字段配置 (sys_module_field): 21 个字段
   * 4. 字段物理源映射 (sys_module_field_source): 25 条映射
   * 5. 权限配置 (sys_permission_config): 37 条权限节点
   */
  private async seedConfigData() {
    try {
      console.log('[数据库服务] 开始清空并重新插入配置数据...');

      // 清空所有表（保持顺序，避免外键约束问题）
      console.log('[数据库服务] 清空现有数据...');
      await this.configDb('sys_permission_config').del();
      await this.configDb('sys_module_field_source').del();
      await this.configDb('sys_module_field').del();
      await this.configDb('sys_module_entity').del();
      await this.configDb('sys_module').del();
      console.log('[数据库服务] 数据清空完成');

      console.log('[数据库服务] 开始插入模块配置数据...');

      // 1. 插入模块基本信息
      await this.configDb('sys_module').insert([
        {
          id: 1,
          module_id: 'MOD-SYS-LOG',
          module_name: '系统操作日志',
          module_desc: '记录系统内所有的用户操作轨迹与流水',
          primary_entity: 'sys_operation_log',
          primary_entity_desc: '系统操作日志表，纯单表流水记录，无任何物理连表关系',
          record_count: 0,
          is_active: 0,
          sort_order: 1,
        },
        {
          id: 2,
          module_id: 'MOD-HR-ORG',
          module_name: '组织架构管理',
          module_desc: '管理企业组织树、部门编制及汇报线关系',
          primary_entity: 'hr_organization',
          primary_entity_desc: '组织单元主表，存储公司、部门、组的层级与基础信息',
          record_count: 4,
          is_active: 1,
          sort_order: 2,
        },
        {
          id: 3,
          module_id: 'MOD-HR-EMP',
          module_name: '员工核心档案',
          module_desc: '维护员工基础信息、教育经历及生命周期',
          primary_entity: 'hr_employee_base',
          primary_entity_desc: '员工主表，包含不可变的基础身份与生命周期状态',
          record_count: 8,
          is_active: 1,
          sort_order: 3,
        },
        {
          id: 4,
          module_id: 'MOD-HR-PAY',
          module_name: '薪酬核算中心',
          module_desc: '处理薪金、社保公积金及个税等复杂计算',
          primary_entity: 'hr_payroll_result',
          primary_entity_desc: '员工个人的核算期薪资发放结果明细',
          record_count: 12,
          is_active: 1,
          sort_order: 4,
        },
      ]);
      console.log('[数据库服务] 模块基本信息插入完成');

      // 2. 插入模块关联表信息
      console.log('[数据库服务] 开始插入模块关联表信息...');
      const entityData = [
        // MOD-SYS-LOG 没有关联表
        
        // MOD-HR-ORG 的关联表
        {
          id: 1,
          module_id: 'MOD-HR-ORG',
          entity_id: '1',
          entity_name: 'hr_org_hierarchy',
          entity_desc: '组织树状层级关系 (Closure Table)',
          join_left_field: 'org_code',
          join_right_field: 'ancestor_code',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 1,
        },
        {
          id: 2,
          module_id: 'MOD-HR-ORG',
          entity_id: '2',
          entity_name: 'hr_position',
          entity_desc: '标准岗位编制池',
          join_left_field: 'org_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 2,
        },
        {
          id: 3,
          module_id: 'MOD-HR-ORG',
          entity_id: '3',
          entity_name: 'sys_user',
          entity_desc: '组织负责人账户引用',
          join_left_field: 'id',
          join_right_field: 'manager_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 3,
        },
        {
          id: 4,
          module_id: 'MOD-HR-ORG',
          entity_id: '4',
          entity_name: 'hr_cost_center',
          entity_desc: '财务成本中心关联',
          join_left_field: 'cost_center_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:1',
          sort_order: 4,
        },

        // MOD-HR-EMP 的关联表
        {
          id: 5,
          module_id: 'MOD-HR-EMP',
          entity_id: '1',
          entity_name: 'hr_emp_job',
          entity_desc: '员工任职信息 (关联岗位、职级、部门)',
          join_left_field: 'emp_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:1',
          sort_order: 1,
        },
        {
          id: 6,
          module_id: 'MOD-HR-EMP',
          entity_id: '2',
          entity_name: 'hr_emp_personal',
          entity_desc: '隐私信息 (身份证、银行卡等加密字段)',
          join_left_field: 'emp_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:1',
          sort_order: 2,
        },
        {
          id: 7,
          module_id: 'MOD-HR-EMP',
          entity_id: '3',
          entity_name: 'hr_emp_contract',
          entity_desc: '劳动合同及试用期流转历程',
          join_left_field: 'emp_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 3,
        },
        {
          id: 8,
          module_id: 'MOD-HR-EMP',
          entity_id: '4',
          entity_name: 'hr_emp_education',
          entity_desc: '教育经历与学历证书',
          join_left_field: 'emp_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 4,
        },
        {
          id: 9,
          module_id: 'MOD-HR-EMP',
          entity_id: '5',
          entity_name: 'hr_organization',
          entity_desc: '关联部门基础信息',
          join_left_field: 'id',
          join_right_field: 'dept_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 5,
        },

        // MOD-HR-PAY 的关联表
        {
          id: 10,
          module_id: 'MOD-HR-PAY',
          entity_id: '1',
          entity_name: 'hr_salary_structure',
          entity_desc: '应用薪资套账与结构化规则',
          join_left_field: 'id',
          join_right_field: 'structure_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 1,
        },
        {
          id: 11,
          module_id: 'MOD-HR-PAY',
          entity_id: '2',
          entity_name: 'hr_payroll_element',
          entity_desc: '单项薪资条目 (基本工资, 绩效, 奖金等)',
          join_left_field: 'result_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 2,
        },
        {
          id: 12,
          module_id: 'MOD-HR-PAY',
          entity_id: '3',
          entity_name: 'hr_social_security_record',
          entity_desc: '当期五险一金扣缴明细及基数快照',
          join_left_field: 'result_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:1',
          sort_order: 3,
        },
        {
          id: 13,
          module_id: 'MOD-HR-PAY',
          entity_id: '4',
          entity_name: 'hr_tax_record',
          entity_desc: '当期个税专项附加扣除与应纳税明细',
          join_left_field: 'result_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:1',
          sort_order: 4,
        },
      ];
      console.log('[数据库服务] 准备插入关联表数据:', entityData.length, '条');
      await this.configDb('sys_module_entity').insert(entityData);
      console.log('[数据库服务] 模块关联表信息插入完成');
      
      // 验证关联表数据
      const orgEntities = await this.configDb('sys_module_entity').where('module_id', 'MOD-HR-ORG');
      console.log('[数据库服务] 验证 MOD-HR-ORG 关联表数:', orgEntities.length, '条');
      console.log('[数据库服务] MOD-HR-ORG 关联表数据:', orgEntities.map(e => ({ id: e.entity_id, name: e.entity_name })));

      // 3. 插入模块字段配置
      await this.configDb('sys_module_field').insert([
        // MOD-SYS-LOG 字段
        {
          id: 1,
          module_id: 'MOD-SYS-LOG',
          field_id: 'SYS_LOG_001',
          display_name: '操作人',
          logical_field: 'operator',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'person',
          render_type: 'Text',
          sort_order: 1,
          is_visible: 1,
        },
        {
          id: 2,
          module_id: 'MOD-SYS-LOG',
          field_id: 'SYS_LOG_002',
          display_name: '操作类型',
          logical_field: 'actionType',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'touch_app',
          render_type: 'Tag',
          sort_order: 2,
          is_visible: 1,
        },
        {
          id: 3,
          module_id: 'MOD-SYS-LOG',
          field_id: 'SYS_LOG_003',
          display_name: '操作时间',
          logical_field: 'createdAt',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'schedule',
          render_type: 'Text',
          sort_order: 3,
          is_visible: 1,
        },

        // MOD-HR-ORG 字段
        {
          id: 4,
          module_id: 'MOD-HR-ORG',
          field_id: 'ORG_001',
          display_name: '组织编码',
          logical_field: 'orgCode',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'tag',
          render_type: 'Text',
          sort_order: 1,
          is_visible: 1,
        },
        {
          id: 5,
          module_id: 'MOD-HR-ORG',
          field_id: 'ORG_002',
          display_name: '组织名称',
          logical_field: 'orgName',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'corporate_fare',
          render_type: 'Text',
          sort_order: 2,
          is_visible: 1,
        },
        {
          id: 6,
          module_id: 'MOD-HR-ORG',
          field_id: 'ORG_003',
          display_name: '组织类型',
          logical_field: 'orgType',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'account_tree',
          render_type: 'Tag',
          sort_order: 3,
          is_visible: 1,
        },
        {
          id: 7,
          module_id: 'MOD-HR-ORG',
          field_id: 'ORG_004',
          display_name: '负责人标识',
          logical_field: 'managerDesc',
          transformer: "CONCAT(${real_name}, ' (', ${emp_no}, ')')",
          transformer_env: 'backend',
          render_icon: 'person',
          render_type: 'Link',
          sort_order: 4,
          is_visible: 1,
        },
        {
          id: 8,
          module_id: 'MOD-HR-ORG',
          field_id: 'ORG_005',
          display_name: '编制情况',
          logical_field: 'headcountStatus',
          transformer: 'ASSEMBLE_FRACTION(${headcount}, ${max_headcount})',
          transformer_env: 'frontend',
          render_icon: 'groups',
          render_type: 'Badge',
          sort_order: 5,
          is_visible: 1,
        },
        {
          id: 9,
          module_id: 'MOD-HR-ORG',
          field_id: 'ORG_006',
          display_name: '生效日期',
          logical_field: 'effectiveDate',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'calendar_today',
          render_type: 'Text',
          sort_order: 6,
          is_visible: 1,
        },

        // MOD-HR-EMP 字段
        {
          id: 10,
          module_id: 'MOD-HR-EMP',
          field_id: 'EMP_001',
          display_name: '工号',
          logical_field: 'empNo',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'badge',
          render_type: 'Text',
          sort_order: 1,
          is_visible: 1,
        },
        {
          id: 11,
          module_id: 'MOD-HR-EMP',
          field_id: 'EMP_002',
          display_name: '英文全名',
          logical_field: 'fullNameEng',
          transformer: "CONCAT(${first_name}, ' ', ${last_name})",
          transformer_env: 'backend',
          render_icon: 'person',
          render_type: 'Text',
          sort_order: 2,
          is_visible: 1,
        },
        {
          id: 12,
          module_id: 'MOD-HR-EMP',
          field_id: 'EMP_003',
          display_name: '证件号码',
          logical_field: 'idNumber',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'pin',
          render_type: 'Text',
          sort_order: 3,
          is_visible: 1,
        },
        {
          id: 13,
          module_id: 'MOD-HR-EMP',
          field_id: 'EMP_004',
          display_name: '员工类型',
          logical_field: 'empType',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'work',
          render_type: 'Tag',
          sort_order: 4,
          is_visible: 1,
        },
        {
          id: 14,
          module_id: 'MOD-HR-EMP',
          field_id: 'EMP_005',
          display_name: '任职部门',
          logical_field: 'deptName',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'corporate_fare',
          render_type: 'Link',
          sort_order: 5,
          is_visible: 1,
        },
        {
          id: 15,
          module_id: 'MOD-HR-EMP',
          field_id: 'EMP_006',
          display_name: '在职状态',
          logical_field: 'empStatus',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'fiber_manual_record',
          render_type: 'Status',
          sort_order: 6,
          is_visible: 1,
        },

        // MOD-HR-PAY 字段
        {
          id: 16,
          module_id: 'MOD-HR-PAY',
          field_id: 'PAY_001',
          display_name: '计薪周期',
          logical_field: 'period',
          transformer: "CONCAT(${payroll_year}, '-', ${payroll_month})",
          transformer_env: 'backend',
          render_icon: 'calendar_month',
          render_type: 'Text',
          sort_order: 1,
          is_visible: 1,
        },
        {
          id: 17,
          module_id: 'MOD-HR-PAY',
          field_id: 'PAY_002',
          display_name: '应发合计',
          logical_field: 'grossPay',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'account_balance_wallet',
          render_type: 'Text',
          sort_order: 2,
          is_visible: 1,
        },
        {
          id: 18,
          module_id: 'MOD-HR-PAY',
          field_id: 'PAY_003',
          display_name: '社保代扣',
          logical_field: 'socialDeduction',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'health_and_safety',
          render_type: 'Text',
          sort_order: 3,
          is_visible: 1,
        },
        {
          id: 19,
          module_id: 'MOD-HR-PAY',
          field_id: 'PAY_004',
          display_name: '个税代扣',
          logical_field: 'taxDeduction',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'receipt_long',
          render_type: 'Text',
          sort_order: 4,
          is_visible: 1,
        },
        {
          id: 20,
          module_id: 'MOD-HR-PAY',
          field_id: 'PAY_005',
          display_name: '实发薪资',
          logical_field: 'netPay',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'payments',
          render_type: 'Badge',
          sort_order: 5,
          is_visible: 1,
        },
        {
          id: 21,
          module_id: 'MOD-HR-PAY',
          field_id: 'PAY_006',
          display_name: '发放状态',
          logical_field: 'status',
          transformer: null,
          transformer_env: 'none',
          render_icon: 'fiber_manual_record',
          render_type: 'Status',
          sort_order: 6,
          is_visible: 1,
        },
      ]);
      console.log('[数据库服务] 模块字段配置插入完成');

      // 4. 插入字段物理源映射
      await this.configDb('sys_module_field_source').insert([
        // MOD-SYS-LOG 字段源
        { id: 1, module_id: 'MOD-SYS-LOG', logical_field: 'operator', source_entity: 'sys_operation_log', source_field: 'operator_name', sort_order: 1 },
        { id: 2, module_id: 'MOD-SYS-LOG', logical_field: 'actionType', source_entity: 'sys_operation_log', source_field: 'action_type', sort_order: 1 },
        { id: 3, module_id: 'MOD-SYS-LOG', logical_field: 'createdAt', source_entity: 'sys_operation_log', source_field: 'created_at', sort_order: 1 },

        // MOD-HR-ORG 字段源
        { id: 4, module_id: 'MOD-HR-ORG', logical_field: 'orgCode', source_entity: 'hr_organization', source_field: 'org_code', sort_order: 1 },
        { id: 5, module_id: 'MOD-HR-ORG', logical_field: 'orgName', source_entity: 'hr_organization', source_field: 'org_name', sort_order: 1 },
        { id: 6, module_id: 'MOD-HR-ORG', logical_field: 'orgType', source_entity: 'hr_organization', source_field: 'org_type', sort_order: 1 },
        { id: 7, module_id: 'MOD-HR-ORG', logical_field: 'managerDesc', source_entity: 'sys_user', source_field: 'real_name', sort_order: 1 },
        { id: 8, module_id: 'MOD-HR-ORG', logical_field: 'managerDesc', source_entity: 'sys_user', source_field: 'emp_no', sort_order: 2 },
        { id: 9, module_id: 'MOD-HR-ORG', logical_field: 'headcountStatus', source_entity: 'hr_organization', source_field: 'headcount', sort_order: 1 },
        { id: 10, module_id: 'MOD-HR-ORG', logical_field: 'headcountStatus', source_entity: 'hr_organization', source_field: 'max_headcount', sort_order: 2 },
        { id: 11, module_id: 'MOD-HR-ORG', logical_field: 'effectiveDate', source_entity: 'hr_organization', source_field: 'effective_date', sort_order: 1 },

        // MOD-HR-EMP 字段源
        { id: 12, module_id: 'MOD-HR-EMP', logical_field: 'empNo', source_entity: 'hr_employee_base', source_field: 'emp_no', sort_order: 1 },
        { id: 13, module_id: 'MOD-HR-EMP', logical_field: 'fullNameEng', source_entity: 'hr_employee_base', source_field: 'first_name', sort_order: 1 },
        { id: 14, module_id: 'MOD-HR-EMP', logical_field: 'fullNameEng', source_entity: 'hr_employee_base', source_field: 'last_name', sort_order: 2 },
        { id: 15, module_id: 'MOD-HR-EMP', logical_field: 'idNumber', source_entity: 'hr_emp_personal', source_field: 'id_card_no', sort_order: 1 },
        { id: 16, module_id: 'MOD-HR-EMP', logical_field: 'empType', source_entity: 'hr_emp_job', source_field: 'emp_type', sort_order: 1 },
        { id: 17, module_id: 'MOD-HR-EMP', logical_field: 'deptName', source_entity: 'hr_organization', source_field: 'org_name', sort_order: 1 },
        { id: 18, module_id: 'MOD-HR-EMP', logical_field: 'empStatus', source_entity: 'hr_employee_base', source_field: 'status', sort_order: 1 },

        // MOD-HR-PAY 字段源
        { id: 19, module_id: 'MOD-HR-PAY', logical_field: 'period', source_entity: 'hr_payroll_result', source_field: 'payroll_year', sort_order: 1 },
        { id: 20, module_id: 'MOD-HR-PAY', logical_field: 'period', source_entity: 'hr_payroll_result', source_field: 'payroll_month', sort_order: 2 },
        { id: 21, module_id: 'MOD-HR-PAY', logical_field: 'grossPay', source_entity: 'hr_payroll_result', source_field: 'gross_amount', sort_order: 1 },
        { id: 22, module_id: 'MOD-HR-PAY', logical_field: 'socialDeduction', source_entity: 'hr_social_security_record', source_field: 'total_personal_deduct', sort_order: 1 },
        { id: 23, module_id: 'MOD-HR-PAY', logical_field: 'taxDeduction', source_entity: 'hr_tax_record', source_field: 'tax_amount', sort_order: 1 },
        { id: 24, module_id: 'MOD-HR-PAY', logical_field: 'netPay', source_entity: 'hr_payroll_result', source_field: 'net_amount', sort_order: 1 },
        { id: 25, module_id: 'MOD-HR-PAY', logical_field: 'status', source_entity: 'hr_payroll_result', source_field: 'payment_status', sort_order: 1 },
      ]);
      console.log('[数据库服务] 字段物理源映射插入完成');

      // 5. 插入权限配置数据 (基于sys_module_field_source生成)
      console.log('[数据库服务] 开始生成并插入权限配置数据...');
      
      // 从sys_module_field_source查询所有物理字段映射
      const fieldSources = await this.configDb('sys_module_field_source').select('*');
      console.log(`[数据库服务] 查询到 ${fieldSources.length} 条字段物理源映射`);

      // 生成权限节点：每个物理字段 × 3种操作类型 (READ, CREATE, UPDATE)
      const operationTypes = ['READ', 'CREATE', 'UPDATE'];
      const uniquePermissions = new Map<string, any>();
      let permissionId = 1;
      
      fieldSources.forEach((source) => {
        operationTypes.forEach((opType) => {
          const permissionNode = `${source.source_entity}.${source.source_field}.${opType}`;
          
          // 使用Map去重，确保每个权限节点只插入一次
          if (!uniquePermissions.has(permissionNode)) {
            uniquePermissions.set(permissionNode, {
              id: permissionId++,
              permission_node: permissionNode,
              entity: source.source_entity,
              field_name: source.source_field,
              operation_type: opType,
              enabled: true,
              module_id: source.module_id,
              logical_field: source.logical_field,
              description: `${source.source_entity}.${source.source_field} - ${opType} 操作权限`,
            });
          }
        });
      });

      const permissionData = Array.from(uniquePermissions.values());
      console.log(`[数据库服务] 生成权限节点数: ${permissionData.length}`);
      
      if (permissionData.length > 0) {
        await this.configDb('sys_permission_config').insert(permissionData);
        console.log('[数据库服务] 权限配置数据插入完成，共', permissionData.length, '条记录');
      }

      // 验证权限配置数据
      const permissionCount = await this.configDb('sys_permission_config').count('* as count').first();
      console.log('[数据库服务] 权限配置表记录数:', permissionCount?.count || 0);
      const samplePermissions = await this.configDb('sys_permission_config').limit(5);
      console.log('[数据库服务] 权限配置样本:', samplePermissions.map(p => ({ node: p.permission_node, entity: p.entity, field: p.field_name, module: p.module_id })));

      console.log('[数据库服务] 配置数据插入完成');
      const finalCount = await this.configDb('sys_module').count('* as count').first();
      console.log('[数据库服务] 最终模块数:', finalCount?.count || 0);
      
      // 验证数据是否真的被插入了
      const allModules = await this.configDb('sys_module').select('*');
      console.log('[数据库服务] 验证插入的模块:', allModules.map(m => ({ id: m.module_id, name: m.module_name })));
    } catch (error) {
      console.error('[数据库服务] 配置数据插入失败:', error);
      throw error;
    }
  }

  /**
   * 插入业务数据库样本数据
   * 
   * 每次启动都会清空并重新插入数据（in-memory 模式）
   * 
   * 插入数据：
   * - hr_organization: 4 个组织单元
   * - sys_user: 4 个用户
   * - hr_employee_base: 8 个员工
   * - hr_emp_job: 8 条任职记录
   * - hr_emp_personal: 8 条隐私信息
   * - hr_salary_structure: 3 个薪资结构
   * - hr_payroll_result: 12 条薪酬结果
   * - hr_social_security_record: 12 条社保记录
   * - hr_tax_record: 12 条个税记录
   */
  private async seedBusinessData() {
    try {
      console.log('[数据库服务] 开始清空并重新插入业务数据...');

      // 清空所有业务表
      console.log('[数据库服务] 清空现有业务数据...');
      await this.businessDb('hr_tax_record').del();
      await this.businessDb('hr_social_security_record').del();
      await this.businessDb('hr_payroll_result').del();
      await this.businessDb('hr_salary_structure').del();
      await this.businessDb('hr_emp_personal').del();
      await this.businessDb('hr_emp_job').del();
      await this.businessDb('hr_employee_base').del();
      await this.businessDb('sys_user').del();
      await this.businessDb('hr_organization').del();
      await this.businessDb('sys_operation_log').del();
      console.log('[数据库服务] 业务数据清空完成');

      console.log('[数据库服务] 插入业务数据...');

      await this.businessDb('hr_organization').insert([
        {
          id: 1,
          org_code: 'ORG-001',
          org_name: '总公司',
          org_type: 'CORP',
          headcount: 50,
          max_headcount: 100,
          effective_date: new Date('2024-01-01'),
          ancestor_code: null,
          manager_id: 1,
        },
        {
          id: 2,
          org_code: 'ORG-002',
          org_name: '人力资源部',
          org_type: 'DEPT',
          headcount: 10,
          max_headcount: 20,
          effective_date: new Date('2024-01-01'),
          ancestor_code: 'ORG-001',
          manager_id: 2,
        },
        {
          id: 3,
          org_code: 'ORG-003',
          org_name: '财务部',
          org_type: 'DEPT',
          headcount: 8,
          max_headcount: 15,
          effective_date: new Date('2024-01-01'),
          ancestor_code: 'ORG-001',
          manager_id: 3,
        },
      ]);

      await this.businessDb('sys_user').insert([
        {
          id: 1,
          username: 'admin',
          real_name: '管理员',
          emp_no: 'EMP-0001',
          dept_id: 1,
          status: '1',
        },
        {
          id: 2,
          username: 'hr_manager',
          real_name: '李经理',
          emp_no: 'EMP-0002',
          dept_id: 2,
          status: '1',
        },
        {
          id: 3,
          username: 'finance_manager',
          real_name: '王经理',
          emp_no: 'EMP-0003',
          dept_id: 3,
          status: '1',
        },
      ]);

      await this.businessDb('hr_employee_base').insert([
        {
          id: 1,
          emp_no: 'EMP-0001',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          dept_id: 1,
          status: '1',
        },
        {
          id: 2,
          emp_no: 'EMP-0002',
          first_name: 'Jane',
          last_name: 'Smith',
          full_name: 'Jane Smith',
          dept_id: 2,
          status: '1',
        },
        {
          id: 3,
          emp_no: 'EMP-0003',
          first_name: 'Bob',
          last_name: 'Johnson',
          full_name: 'Bob Johnson',
          dept_id: 3,
          status: '1',
        },
        {
          id: 4,
          emp_no: 'EMP-0004',
          first_name: 'Alice',
          last_name: 'Williams',
          full_name: 'Alice Williams',
          dept_id: 2,
          status: '1',
        },
      ]);

      await this.businessDb('hr_emp_job').insert([
        { id: 1, emp_id: 1, dept_id: 1, job_title: 'CEO', emp_type: 'FULL_TIME' },
        { id: 2, emp_id: 2, dept_id: 2, job_title: 'HR Manager', emp_type: 'FULL_TIME' },
        { id: 3, emp_id: 3, dept_id: 3, job_title: 'Finance Manager', emp_type: 'FULL_TIME' },
        { id: 4, emp_id: 4, dept_id: 2, job_title: 'HR Specialist', emp_type: 'FULL_TIME' },
      ]);

      await this.businessDb('hr_emp_personal').insert([
        { id: 1, emp_id: 1, id_card_no: '110101199001011234', bank_account: '6222021234567890' },
        { id: 2, emp_id: 2, id_card_no: '110101199101021234', bank_account: '6222021234567891' },
        { id: 3, emp_id: 3, id_card_no: '110101199201031234', bank_account: '6222021234567892' },
        { id: 4, emp_id: 4, id_card_no: '110101199301041234', bank_account: '6222021234567893' },
      ]);

      await this.businessDb('hr_salary_structure').insert([
        { id: 1, structure_code: 'STR-001', base_salary: 15000, allowance: 2000 },
        { id: 2, structure_code: 'STR-002', base_salary: 12000, allowance: 1500 },
      ]);

      await this.businessDb('hr_payroll_result').insert([
        {
          id: 1,
          emp_id: 1,
          payroll_year: 2024,
          payroll_month: 1,
          gross_amount: 17000,
          net_amount: 14500,
          payment_status: '1',
          structure_id: 1,
        },
        {
          id: 2,
          emp_id: 2,
          payroll_year: 2024,
          payroll_month: 1,
          gross_amount: 13500,
          net_amount: 11500,
          payment_status: '1',
          structure_id: 2,
        },
        {
          id: 3,
          emp_id: 3,
          payroll_year: 2024,
          payroll_month: 1,
          gross_amount: 13500,
          net_amount: 11500,
          payment_status: '1',
          structure_id: 2,
        },
        {
          id: 4,
          emp_id: 4,
          payroll_year: 2024,
          payroll_month: 1,
          gross_amount: 13500,
          net_amount: 11500,
          payment_status: '0',
          structure_id: 2,
        },
      ]);

      await this.businessDb('hr_social_security_record').insert([
        { id: 1, result_id: 1, total_personal_deduct: 1500, total_company_deduct: 2000 },
        { id: 2, result_id: 2, total_personal_deduct: 1200, total_company_deduct: 1600 },
        { id: 3, result_id: 3, total_personal_deduct: 1200, total_company_deduct: 1600 },
        { id: 4, result_id: 4, total_personal_deduct: 1200, total_company_deduct: 1600 },
      ]);

      await this.businessDb('hr_tax_record').insert([
        { id: 1, result_id: 1, tax_amount: 1000, taxable_income: 15500 },
        { id: 2, result_id: 2, tax_amount: 800, taxable_income: 12300 },
        { id: 3, result_id: 3, tax_amount: 800, taxable_income: 12300 },
        { id: 4, result_id: 4, tax_amount: 800, taxable_income: 12300 },
      ]);

      await this.businessDb('sys_operation_log').insert([
        {
          id: 1,
          operator_name: 'admin',
          action_type: 'LOGIN',
          ip_address: '192.168.1.1',
        },
        {
          id: 2,
          operator_name: 'hr_manager',
          action_type: 'VIEW_PAYROLL',
          ip_address: '192.168.1.2',
        },
      ]);

      console.log('[数据库服务] 业务数据插入完成');
    } catch (error) {
      console.error('[数据库服务] 业务数据插入失败:', error);
      throw error;
    }
  }
}
