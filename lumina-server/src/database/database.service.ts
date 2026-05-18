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
    // 班级表
    if (!(await this.businessDb.schema.hasTable('class'))) {
      await this.businessDb.schema.createTable('class', (table) => {
        table.increments('id').primary();
        table.string('class_code', 20).unique().notNullable();
        table.string('class_name', 100).notNullable();
        table.string('grade_level', 20).notNullable();
        table.integer('head_teacher_id');
        table.integer('student_count').defaultTo(0);
        table.integer('capacity').defaultTo(50);
        table.timestamps(true, true);
      });
    }

    // 教师表
    if (!(await this.businessDb.schema.hasTable('teacher'))) {
      await this.businessDb.schema.createTable('teacher', (table) => {
        table.increments('id').primary();
        table.string('teacher_code', 20).unique().notNullable();
        table.string('first_name', 50).notNullable();
        table.string('last_name', 50).notNullable();
        table.string('subject', 50);
        table.string('phone', 20);
        table.string('email', 100);
        table.date('hire_date');
        table.integer('department_id');
        table.timestamps(true, true);
      });
    }

    // 学生表
    if (!(await this.businessDb.schema.hasTable('student'))) {
      await this.businessDb.schema.createTable('student', (table) => {
        table.increments('id').primary();
        table.string('student_no', 20).unique().notNullable();
        table.string('first_name', 50).notNullable();
        table.string('last_name', 50).notNullable();
        table.integer('gender');
        table.date('birth_date');
        table.date('enrollment_date');
        table.integer('status').defaultTo(1);
        table.integer('class_id');
        table.string('contact_phone', 20);
        table.timestamps(true, true);
      });
    }

    // 课程表
    if (!(await this.businessDb.schema.hasTable('course'))) {
      await this.businessDb.schema.createTable('course', (table) => {
        table.increments('id').primary();
        table.string('course_code', 20).unique().notNullable();
        table.string('course_name', 100).notNullable();
        table.decimal('credits', 3, 1);
        table.timestamps(true, true);
      });
    }

    // 成绩表
    if (!(await this.businessDb.schema.hasTable('score'))) {
      await this.businessDb.schema.createTable('score', (table) => {
        table.increments('id').primary();
        table.integer('student_id').notNullable();
        table.integer('course_id').notNullable();
        table.string('semester', 20);
        table.decimal('score', 5, 2);
        table.string('grade_level', 10);
        table.date('exam_date');
        table.timestamps(true, true);
      });
    }

    // 部门表（用于教师档案模块）
    if (!(await this.businessDb.schema.hasTable('department'))) {
      await this.businessDb.schema.createTable('department', (table) => {
        table.increments('id').primary();
        table.string('department_code', 20).unique().notNullable();
        table.string('department_name', 100).notNullable();
        table.string('location', 100);
        table.timestamps(true, true);
      });
    }

    // 选课表（用于学生课程模块）
    if (!(await this.businessDb.schema.hasTable('enrollment'))) {
      await this.businessDb.schema.createTable('enrollment', (table) => {
        table.increments('id').primary();
        table.integer('student_id').notNullable();
        table.integer('course_id').notNullable();
        table.date('enrollment_date');
        table.integer('status').defaultTo(1);
        table.timestamps(true, true);
      });
    }
  }

  /**
   * 插入配置数据库样本数据
   * 
   * 学生管理系统配置数据：
   * 1. 模块基本信息 (sys_module): 5 个模块
   * 2. 模块关联表 (sys_module_entity): 7 条记录
   * 3. 模块字段配置 (sys_module_field): 28 个字段（包含 source_mapping JSON）
   * 4. 权限配置 (sys_permission_config): 自动生成
   */
  private async seedConfigData() {
    try {
      console.log('[数据库服务] 开始清空并重新插入配置数据...');

      // 清空所有表
      await this.configDb('sys_permission_config').del();
      await this.configDb('sys_module_field').del();
      await this.configDb('sys_module_entity').del();
      await this.configDb('sys_module').del();
      
      // 添加清空审批链模板数据
      await this.configDb('sys_approval_chain_config').del();
      
      // 重要：清空所有在途流程实例、任务和日志，防止主外键引用失效或出现“脏数据”
      await this.configDb('sys_approval_task').del();
      await this.configDb('sys_approval_log').del();
      await this.configDb('sys_approval_instance').del();
      
      console.log('[数据库服务] 配置与工作流历史数据清空完成');

      // --- 工作流 DEMO 种子数据 ---
      const [node1Id] = await this.configDb('sys_approval_chain_config').insert({
        module_id: 'MOD-SCORE-DETAIL',
        up_id: 0,
        node_name: '教研组长初审',
        node_type: 'user_task',
        role_target: 'head_teacher'
      }).returning('id');

      const [node2Id] = await this.configDb('sys_approval_chain_config').insert({
        module_id: 'MOD-SCORE-DETAIL',
        up_id: node1Id.id || node1Id, // Handle both object and raw number return formats
        node_name: '跨部门并联交接',
        node_type: 'parallel_group',
        parallel_branches: JSON.stringify([
          { branch_id: 'b1', name: '教务处核准', role_target: 'academic_admin' },
          { branch_id: 'b2', name: '财务处退费复核', role_target: 'finance' }
        ]),
        re_approval_strategy: 'smart_rollback'
      }).returning('id');

      const [node3Id] = await this.configDb('sys_approval_chain_config').insert({
        module_id: 'MOD-SCORE-DETAIL',
        up_id: node2Id.id || node2Id,
        node_name: '校长终审',
        node_type: 'user_task',
        role_target: 'principal'
      }).returning('id');

      // 更新 next_id 链接 (双向链表)
      await this.configDb('sys_approval_chain_config').where({ id: node1Id.id || node1Id }).update({ next_id: node2Id.id || node2Id });
      await this.configDb('sys_approval_chain_config').where({ id: node2Id.id || node2Id }).update({ next_id: node3Id.id || node3Id });

      console.log('[数据库服务] 审批流模板配置插入完成');

      // 1. 插入模块基本信息
      await this.configDb('sys_module').insert([
        {
          id: 1,
          module_id: 'MOD-CLASS-SIMPLE',
          module_name: '班级简单信息',
          module_desc: '班级简单信息 - 只有主实体',
          primary_entity: 'class',
          primary_entity_desc: '班级主表',
          record_count: 3,
          is_active: 1,
          sort_order: 1,
        },
        {
          id: 2,
          module_id: 'MOD-STUDENT-BASIC',
          module_name: '学生基本信息',
          module_desc: '学生基本信息 - 1:1 关联实体（学生 N:1 班级）',
          primary_entity: 'student',
          primary_entity_desc: '学生主表',
          record_count: 10,
          is_active: 1,
          sort_order: 2,
        },
        {
          id: 3,
          module_id: 'MOD-CLASS-STUDENTS',
          module_name: '班级学生列表',
          module_desc: '班级学生列表 - 1:N 关联实体（班级 1:N 学生）',
          primary_entity: 'class',
          primary_entity_desc: '班级主表',
          record_count: 3,
          is_active: 1,
          sort_order: 3,
        },
        {
          id: 4,
          module_id: 'MOD-SCORE-DETAIL',
          module_name: '成绩详情',
          module_desc: '成绩详情 - N:1 关联实体（成绩 N:1 学生、课程）',
          primary_entity: 'score',
          primary_entity_desc: '成绩主表',
          record_count: 30,
          is_active: 1,
          sort_order: 4,
        },
        {
          id: 5,
          module_id: 'MOD-STUDENT-FULL',
          module_name: '学生完整信息',
          module_desc: '学生完整信息 - 混合 1:1、1:N、N:1 关联',
          primary_entity: 'student',
          primary_entity_desc: '学生主表',
          record_count: 10,
          is_active: 1,
          sort_order: 5,
        },
      ]);
      console.log('[数据库服务] 模块基本信息插入完成');

      // 2. 插入模块关联表信息
      await this.configDb('sys_module_entity').insert([
        // MOD-STUDENT-BASIC 的关联表
        {
          id: 1,
          module_id: 'MOD-STUDENT-BASIC',
          entity_id: '1',
          entity_name: 'class',
          entity_desc: '班级信息',
          join_left_field: 'id',
          join_right_field: 'class_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 1,
        },
        // MOD-CLASS-STUDENTS 的关联表
        {
          id: 2,
          module_id: 'MOD-CLASS-STUDENTS',
          entity_id: '2',
          entity_name: 'student',
          entity_desc: '学生列表',
          join_left_field: 'class_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 1,
        },
        // MOD-SCORE-DETAIL 的关联表
        {
          id: 3,
          module_id: 'MOD-SCORE-DETAIL',
          entity_id: '3',
          entity_name: 'student',
          entity_desc: '学生信息',
          join_left_field: 'id',
          join_right_field: 'student_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 1,
        },
        {
          id: 4,
          module_id: 'MOD-SCORE-DETAIL',
          entity_id: '4',
          entity_name: 'course',
          entity_desc: '课程信息',
          join_left_field: 'id',
          join_right_field: 'course_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 2,
        },
        // MOD-STUDENT-FULL 的关联表
        {
          id: 5,
          module_id: 'MOD-STUDENT-FULL',
          entity_id: '5',
          entity_name: 'class',
          entity_desc: '班级信息',
          join_left_field: 'id',
          join_right_field: 'class_id',
          entity_status: '正常',
          relation_type: 'N:1',
          sort_order: 1,
        },
        {
          id: 7,
          module_id: 'MOD-STUDENT-FULL',
          entity_id: '7',
          entity_name: 'score',
          entity_desc: '成绩记录',
          join_left_field: 'student_id',
          join_right_field: 'id',
          entity_status: '正常',
          relation_type: '1:N',
          sort_order: 2,
        },
      ]);
      console.log('[数据库服务] 模块关联表信息插入完成');

      // 3. 插入模块字段配置 - 包含物理字段映射（JSON 格式）
      await this.configDb('sys_module_field').insert([
        // ========== MOD-CLASS-SIMPLE 字段（模块1：只有主实体）==========
        { id: 1, module_id: 'MOD-CLASS-SIMPLE', display_name: '班级编号', logical_field: 'classCode', source_mapping: JSON.stringify([{ entity: 'class', field: 'class_code', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-id', render_type: 'text', sort_order: 1, is_visible: 1 },
        { id: 2, module_id: 'MOD-CLASS-SIMPLE', display_name: '班级名称', logical_field: 'className', source_mapping: JSON.stringify([{ entity: 'class', field: 'class_name', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-class', render_type: 'text', sort_order: 2, is_visible: 1 },
        { id: 3, module_id: 'MOD-CLASS-SIMPLE', display_name: '年级', logical_field: 'gradeLevel', source_mapping: JSON.stringify([{ entity: 'class', field: 'grade_level', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-grade', render_type: 'text', sort_order: 3, is_visible: 1 },
        { id: 4, module_id: 'MOD-CLASS-SIMPLE', display_name: '学生人数', logical_field: 'studentCount', source_mapping: JSON.stringify([{ entity: 'class', field: 'student_count', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-users', render_type: 'number', sort_order: 4, is_visible: 1 },

        // ========== MOD-STUDENT-BASIC 字段（模块2：1:1关联）==========
        { id: 5, module_id: 'MOD-STUDENT-BASIC', display_name: '学号', logical_field: 'studentNo', source_mapping: JSON.stringify([{ entity: 'student', field: 'student_no', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-id', render_type: 'text', sort_order: 1, is_visible: 1 },
        { id: 6, module_id: 'MOD-STUDENT-BASIC', display_name: '姓名', logical_field: 'fullName', source_mapping: JSON.stringify([{ entity: 'student', field: 'last_name', sort_order: 1 }, { entity: 'student', field: 'first_name', sort_order: 2 }]), transformer: 'CONCAT(${last_name}, ${first_name})', transformer_env: 'frontend', render_icon: 'icon-user', render_type: 'text', sort_order: 2, is_visible: 1 },
        { id: 7, module_id: 'MOD-STUDENT-BASIC', display_name: '性别', logical_field: 'genderText', source_mapping: JSON.stringify([{ entity: 'student', field: 'gender', sort_order: 1 }]), transformer: 'DICT_MAP("GENDER", ${gender})', transformer_env: 'frontend', render_icon: 'icon-gender', render_type: 'text', sort_order: 3, is_visible: 1 },
        { id: 8, module_id: 'MOD-STUDENT-BASIC', display_name: '班级名称', logical_field: 'className', source_mapping: JSON.stringify([{ entity: 'class', field: 'class_name', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-class', render_type: 'text', sort_order: 4, is_visible: 1 },
        { id: 9, module_id: 'MOD-STUDENT-BASIC', display_name: '年级', logical_field: 'gradeLevel', source_mapping: JSON.stringify([{ entity: 'class', field: 'grade_level', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-grade', render_type: 'text', sort_order: 5, is_visible: 1 },

        // ========== MOD-CLASS-STUDENTS 字段（模块3：1:N关联）==========
        { id: 10, module_id: 'MOD-CLASS-STUDENTS', display_name: '班级编号', logical_field: 'classCode', source_mapping: JSON.stringify([{ entity: 'class', field: 'class_code', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-id', render_type: 'text', sort_order: 1, is_visible: 1 },
        { id: 11, module_id: 'MOD-CLASS-STUDENTS', display_name: '班级名称', logical_field: 'className', source_mapping: JSON.stringify([{ entity: 'class', field: 'class_name', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-class', render_type: 'text', sort_order: 2, is_visible: 1 },
        { id: 12, module_id: 'MOD-CLASS-STUDENTS', display_name: '年级', logical_field: 'gradeLevel', source_mapping: JSON.stringify([{ entity: 'class', field: 'grade_level', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-grade', render_type: 'text', sort_order: 3, is_visible: 1 },
        { id: 13, module_id: 'MOD-CLASS-STUDENTS', display_name: '学生人数', logical_field: 'studentCount', source_mapping: JSON.stringify([{ entity: 'class', field: 'student_count', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-users', render_type: 'number', sort_order: 4, is_visible: 1 },
        // 1:N 嵌套字段（属于 student 实体）
        { id: 14, module_id: 'MOD-CLASS-STUDENTS', display_name: '学号', logical_field: 'studentNo', source_mapping: JSON.stringify([{ entity: 'student', field: 'student_no', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-id', render_type: 'text', sort_order: 5, is_visible: 1 },
        { id: 15, module_id: 'MOD-CLASS-STUDENTS', display_name: '学生姓名', logical_field: 'fullName', source_mapping: JSON.stringify([{ entity: 'student', field: 'last_name', sort_order: 1 }, { entity: 'student', field: 'first_name', sort_order: 2 }]), transformer: 'CONCAT(${last_name}, ${first_name})', transformer_env: 'frontend', render_icon: 'icon-user', render_type: 'text', sort_order: 6, is_visible: 1 },
        { id: 16, module_id: 'MOD-CLASS-STUDENTS', display_name: '学生性别', logical_field: 'genderText', source_mapping: JSON.stringify([{ entity: 'student', field: 'gender', sort_order: 1 }]), transformer: 'DICT_MAP("GENDER", ${gender})', transformer_env: 'frontend', render_icon: 'icon-gender', render_type: 'text', sort_order: 7, is_visible: 1 },

        // ========== MOD-SCORE-DETAIL 字段（模块4：N:1关联）==========
        { id: 17, module_id: 'MOD-SCORE-DETAIL', display_name: '学号', logical_field: 'studentNo', source_mapping: JSON.stringify([{ entity: 'student', field: 'student_no', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-id', render_type: 'text', sort_order: 1, is_visible: 1 },
        { id: 18, module_id: 'MOD-SCORE-DETAIL', display_name: '学生姓名', logical_field: 'studentName', source_mapping: JSON.stringify([{ entity: 'student', field: 'last_name', sort_order: 1 }, { entity: 'student', field: 'first_name', sort_order: 2 }]), transformer: 'CONCAT(${last_name}, ${first_name})', transformer_env: 'frontend', render_icon: 'icon-user', render_type: 'text', sort_order: 2, is_visible: 1 },
        { id: 19, module_id: 'MOD-SCORE-DETAIL', display_name: '课程名称', logical_field: 'courseName', source_mapping: JSON.stringify([{ entity: 'course', field: 'course_name', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-book', render_type: 'text', sort_order: 3, is_visible: 1 },
        { id: 20, module_id: 'MOD-SCORE-DETAIL', display_name: '学分', logical_field: 'credits', source_mapping: JSON.stringify([{ entity: 'course', field: 'credits', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-star', render_type: 'number', sort_order: 4, is_visible: 1 },
        { id: 21, module_id: 'MOD-SCORE-DETAIL', display_name: '学期', logical_field: 'semester', source_mapping: JSON.stringify([{ entity: 'score', field: 'semester', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-calendar', render_type: 'text', sort_order: 5, is_visible: 1 },
        { id: 22, module_id: 'MOD-SCORE-DETAIL', display_name: '分数', logical_field: 'scoreValue', source_mapping: JSON.stringify([{ entity: 'score', field: 'score', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-score', render_type: 'number', sort_order: 6, is_visible: 1 },
        { id: 23, module_id: 'MOD-SCORE-DETAIL', display_name: '等级', logical_field: 'scoreGrade', source_mapping: JSON.stringify([{ entity: 'score', field: 'grade_level', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-grade', render_type: 'text', sort_order: 7, is_visible: 1 },
        { id: 24, module_id: 'MOD-SCORE-DETAIL', display_name: '成绩显示', logical_field: 'scoreDisplay', source_mapping: JSON.stringify([{ entity: 'score', field: 'score', sort_order: 1 }, { entity: 'score', field: 'grade_level', sort_order: 2 }]), transformer: 'CONCAT(${score}, "分 (", ${grade_level}, ")")', transformer_env: 'frontend', render_icon: 'icon-score', render_type: 'text', sort_order: 8, is_visible: 1 },
        { id: 25, module_id: 'MOD-SCORE-DETAIL', display_name: '考试日期', logical_field: 'examDate', source_mapping: JSON.stringify([{ entity: 'score', field: 'exam_date', sort_order: 1 }]), transformer: 'DATE_FORMAT(exam_date, "%Y-%m-%d")', transformer_env: 'database', render_icon: 'icon-calendar', render_type: 'date', sort_order: 9, is_visible: 1 },

        // ========== MOD-STUDENT-FULL 字段（模块5：混合关联）==========
        { id: 26, module_id: 'MOD-STUDENT-FULL', display_name: '学号', logical_field: 'studentNo', source_mapping: JSON.stringify([{ entity: 'student', field: 'student_no', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-id', render_type: 'text', sort_order: 1, is_visible: 1 },
        { id: 27, module_id: 'MOD-STUDENT-FULL', display_name: '姓名', logical_field: 'fullName', source_mapping: JSON.stringify([{ entity: 'student', field: 'last_name', sort_order: 1 }, { entity: 'student', field: 'first_name', sort_order: 2 }]), transformer: 'CONCAT(${last_name}, ${first_name})', transformer_env: 'frontend', render_icon: 'icon-user', render_type: 'text', sort_order: 2, is_visible: 1 },
        { id: 28, module_id: 'MOD-STUDENT-FULL', display_name: '性别', logical_field: 'genderText', source_mapping: JSON.stringify([{ entity: 'student', field: 'gender', sort_order: 1 }]), transformer: 'DICT_MAP("GENDER", ${gender})', transformer_env: 'frontend', render_icon: 'icon-gender', render_type: 'text', sort_order: 3, is_visible: 1 },
        { id: 29, module_id: 'MOD-STUDENT-FULL', display_name: '出生日期', logical_field: 'birthDate', source_mapping: JSON.stringify([{ entity: 'student', field: 'birth_date', sort_order: 1 }]), transformer: 'DATE_FORMAT(birth_date, "%Y年%m月%d日")', transformer_env: 'database', render_icon: 'icon-calendar', render_type: 'date', sort_order: 4, is_visible: 1 },
        { id: 30, module_id: 'MOD-STUDENT-FULL', display_name: '年龄', logical_field: 'age', source_mapping: JSON.stringify([{ entity: 'student', field: 'birth_date', sort_order: 1 }]), transformer: 'TIMESTAMPDIFF(YEAR, birth_date, NOW())', transformer_env: 'database', render_icon: 'icon-age', render_type: 'number', sort_order: 5, is_visible: 1 },
        { id: 31, module_id: 'MOD-STUDENT-FULL', display_name: '班级名称', logical_field: 'className', source_mapping: JSON.stringify([{ entity: 'class', field: 'class_name', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-class', render_type: 'text', sort_order: 6, is_visible: 1 },
        { id: 32, module_id: 'MOD-STUDENT-FULL', display_name: '年级', logical_field: 'gradeLevel', source_mapping: JSON.stringify([{ entity: 'class', field: 'grade_level', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-grade', render_type: 'text', sort_order: 7, is_visible: 1 },
        // 1:N 嵌套字段（属于 score 实体）
        { id: 37, module_id: 'MOD-STUDENT-FULL', display_name: '学期', logical_field: 'semester', source_mapping: JSON.stringify([{ entity: 'score', field: 'semester', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-calendar', render_type: 'text', sort_order: 8, is_visible: 1 },
        { id: 38, module_id: 'MOD-STUDENT-FULL', display_name: '分数', logical_field: 'scoreValue', source_mapping: JSON.stringify([{ entity: 'score', field: 'score', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-score', render_type: 'number', sort_order: 9, is_visible: 1 },
        { id: 39, module_id: 'MOD-STUDENT-FULL', display_name: '等级', logical_field: 'scoreGrade', source_mapping: JSON.stringify([{ entity: 'score', field: 'grade_level', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-grade', render_type: 'text', sort_order: 10, is_visible: 1 },
        { id: 40, module_id: 'MOD-STUDENT-FULL', display_name: '成绩显示', logical_field: 'scoreDisplay', source_mapping: JSON.stringify([{ entity: 'score', field: 'score', sort_order: 1 }, { entity: 'score', field: 'grade_level', sort_order: 2 }]), transformer: 'CONCAT(${score}, "分 (", ${grade_level}, ")")', transformer_env: 'frontend', render_icon: 'icon-score', render_type: 'text', sort_order: 11, is_visible: 1 },
        { id: 41, module_id: 'MOD-STUDENT-FULL', display_name: '考试日期', logical_field: 'examDate', source_mapping: JSON.stringify([{ entity: 'score', field: 'exam_date', sort_order: 1 }]), transformer: null, transformer_env: 'none', render_icon: 'icon-calendar', render_type: 'date', sort_order: 12, is_visible: 1 },
      ]);
      console.log('[数据库服务] 模块字段配置插入完成');

      // 4. 生成权限配置 - 基于物理实体和物理字段生成权限节点
      // 权限节点格式简洁：entity.field.operation_type
      // 但需要为每个 module 保存一条记录，以便区分不同 module 下的权限
      const fields = await this.configDb('sys_module_field').select('*');
      const operationTypes = ['READ', 'CREATE', 'UPDATE'];
      const uniquePermissions = new Map<string, any>();
      const permissionsByModule = new Map<string, any[]>(); // 按 module 分组
      let permissionId = 1;
      
      fields.forEach((field) => {
        if (field.source_mapping) {
          const sources = JSON.parse(field.source_mapping);
          sources.forEach((source: any) => {
            operationTypes.forEach((opType) => {
              // 权限节点格式：entity.field.operation_type（简洁格式）
              const permissionNode = `${source.entity}.${source.field}.${opType}`;
              
              // 为每个 module 保存一条权限记录
              const moduleKey = `${field.module_id}`;
              if (!permissionsByModule.has(moduleKey)) {
                permissionsByModule.set(moduleKey, []);
              }
              
              // 检查该 module 是否已经有这个权限节点
              const modulePermissions = permissionsByModule.get(moduleKey)!;
              const existingPermission = modulePermissions.find(p => p.permission_node === permissionNode);
              
              if (!existingPermission) {
                const permission = {
                  id: permissionId++,
                  permission_node: permissionNode,
                  entity: source.entity,
                  field_name: source.field,
                  operation_type: opType,
                  enabled: true,
                  module_id: field.module_id,
                  logical_field: field.logical_field,
                  description: `${source.entity}.${source.field} - ${opType}`,
                };
                modulePermissions.push(permission);
                uniquePermissions.set(`${moduleKey}.${permissionNode}`, permission);
              }
            });
          });
        }
      });

      const permissionData = Array.from(uniquePermissions.values());
      if (permissionData.length > 0) {
        await this.configDb('sys_permission_config').insert(permissionData);
        console.log('[数据库服务] 权限配置数据插入完成，共', permissionData.length, '条记录');
      }

      console.log('[数据库服务] 配置数据插入完成');
    } catch (error) {
      console.error('[数据库服务] 配置数据插入失败:', error);
      throw error;
    }
  }

  /**
   * 插入业务数据库样本数据
   * 
   * 学生管理系统数据：
   * - teacher: 3 个教师
   * - class: 3 个班级
   * - student: 10 个学生
   * - course: 5 门课程
   * - score: 30 条成绩记录
   */
  private async seedBusinessData() {
    try {
      console.log('[数据库服务] 开始清空并重新插入业务数据...');

      // 清空所有业务表
      console.log('[数据库服务] 清空现有业务数据...');
      await this.businessDb('score').del();
      await this.businessDb('course').del();
      await this.businessDb('student').del();
      await this.businessDb('teacher').del();
      await this.businessDb('class').del();
      console.log('[数据库服务] 业务数据清空完成');

      console.log('[数据库服务] 插入业务数据...');

      // 插入教师
      await this.businessDb('teacher').insert([
        { id: 1, teacher_code: 'T001', first_name: '明', last_name: '王', subject: '数学', phone: '13800001111', email: 'wang.ming@school.edu', hire_date: '2020-09-01' },
        { id: 2, teacher_code: 'T002', first_name: '芳', last_name: '李', subject: '语文', phone: '13800002222', email: 'li.fang@school.edu', hire_date: '2020-09-01' },
        { id: 3, teacher_code: 'T003', first_name: '强', last_name: '张', subject: '英语', phone: '13800003333', email: 'zhang.qiang@school.edu', hire_date: '2021-09-01' },
      ]);

      // 插入班级
      await this.businessDb('class').insert([
        { id: 1, class_code: '2024-01', class_name: '高一(1)班', grade_level: '高一', head_teacher_id: 1, student_count: 5 },
        { id: 2, class_code: '2024-02', class_name: '高一(2)班', grade_level: '高一', head_teacher_id: 2, student_count: 3 },
        { id: 3, class_code: '2023-01', class_name: '高二(1)班', grade_level: '高二', head_teacher_id: 3, student_count: 2 },
      ]);

      // 插入学生
      await this.businessDb('student').insert([
        { id: 1, student_no: '2024001', first_name: '伟', last_name: '张', gender: 1, birth_date: '2008-03-15', enrollment_date: '2024-09-01', status: 1, class_id: 1, contact_phone: '13812345678' },
        { id: 2, student_no: '2024002', first_name: '丽', last_name: '李', gender: 2, birth_date: '2008-05-20', enrollment_date: '2024-09-01', status: 1, class_id: 1, contact_phone: '13887654321' },
        { id: 3, student_no: '2024003', first_name: '明', last_name: '王', gender: 1, birth_date: '2008-04-10', enrollment_date: '2024-09-01', status: 1, class_id: 1, contact_phone: '13898765432' },
        { id: 4, student_no: '2024004', first_name: '芳', last_name: '刘', gender: 2, birth_date: '2008-06-25', enrollment_date: '2024-09-01', status: 1, class_id: 1, contact_phone: '13876543210' },
        { id: 5, student_no: '2024005', first_name: '强', last_name: '陈', gender: 1, birth_date: '2008-07-30', enrollment_date: '2024-09-01', status: 1, class_id: 1, contact_phone: '13865432109' },
        { id: 6, student_no: '2024006', first_name: '娟', last_name: '杨', gender: 2, birth_date: '2008-08-15', enrollment_date: '2024-09-01', status: 1, class_id: 2, contact_phone: '13854321098' },
        { id: 7, student_no: '2024007', first_name: '涛', last_name: '黄', gender: 1, birth_date: '2008-09-20', enrollment_date: '2024-09-01', status: 1, class_id: 2, contact_phone: '13843210987' },
        { id: 8, student_no: '2024008', first_name: '红', last_name: '周', gender: 2, birth_date: '2008-10-05', enrollment_date: '2024-09-01', status: 1, class_id: 2, contact_phone: '13832109876' },
        { id: 9, student_no: '2023001', first_name: '军', last_name: '吴', gender: 1, birth_date: '2007-03-15', enrollment_date: '2023-09-01', status: 1, class_id: 3, contact_phone: '13821098765' },
        { id: 10, student_no: '2023002', first_name: '敏', last_name: '郑', gender: 2, birth_date: '2007-05-20', enrollment_date: '2023-09-01', status: 1, class_id: 3, contact_phone: '13810987654' },
      ]);

      // 插入课程
      await this.businessDb('course').insert([
        { id: 1, course_code: 'C001', course_name: '数学', credits: 4.0 },
        { id: 2, course_code: 'C002', course_name: '语文', credits: 4.0 },
        { id: 3, course_code: 'C003', course_name: '英语', credits: 4.0 },
        { id: 4, course_code: 'C004', course_name: '物理', credits: 3.0 },
        { id: 5, course_code: 'C005', course_name: '化学', credits: 3.0 },
      ]);

      // 插入成绩
      await this.businessDb('score').insert([
        // 学生 1 的成绩
        { id: 1, student_id: 1, course_id: 1, semester: '2024-1', score: 95.5, grade_level: 'A', exam_date: '2024-11-15' },
        { id: 2, student_id: 1, course_id: 2, semester: '2024-1', score: 88.0, grade_level: 'B', exam_date: '2024-11-16' },
        { id: 3, student_id: 1, course_id: 3, semester: '2024-1', score: 92.0, grade_level: 'A', exam_date: '2024-11-17' },
        // 学生 2 的成绩
        { id: 4, student_id: 2, course_id: 1, semester: '2024-1', score: 87.5, grade_level: 'B', exam_date: '2024-11-15' },
        { id: 5, student_id: 2, course_id: 2, semester: '2024-1', score: 91.0, grade_level: 'A', exam_date: '2024-11-16' },
        { id: 6, student_id: 2, course_id: 3, semester: '2024-1', score: 85.5, grade_level: 'B', exam_date: '2024-11-17' },
        // 学生 3 的成绩
        { id: 7, student_id: 3, course_id: 1, semester: '2024-1', score: 78.0, grade_level: 'C', exam_date: '2024-11-15' },
        { id: 8, student_id: 3, course_id: 2, semester: '2024-1', score: 82.5, grade_level: 'B', exam_date: '2024-11-16' },
        { id: 9, student_id: 3, course_id: 3, semester: '2024-1', score: 80.0, grade_level: 'B', exam_date: '2024-11-17' },
        // 学生 4 的成绩
        { id: 10, student_id: 4, course_id: 1, semester: '2024-1', score: 93.0, grade_level: 'A', exam_date: '2024-11-15' },
        { id: 11, student_id: 4, course_id: 2, semester: '2024-1', score: 89.5, grade_level: 'B', exam_date: '2024-11-16' },
        { id: 12, student_id: 4, course_id: 3, semester: '2024-1', score: 94.0, grade_level: 'A', exam_date: '2024-11-17' },
        // 学生 5 的成绩
        { id: 13, student_id: 5, course_id: 1, semester: '2024-1', score: 76.5, grade_level: 'C', exam_date: '2024-11-15' },
        { id: 14, student_id: 5, course_id: 2, semester: '2024-1', score: 79.0, grade_level: 'C', exam_date: '2024-11-16' },
        { id: 15, student_id: 5, course_id: 3, semester: '2024-1', score: 81.5, grade_level: 'B', exam_date: '2024-11-17' },
        // 学生 6 的成绩
        { id: 16, student_id: 6, course_id: 1, semester: '2024-1', score: 88.5, grade_level: 'B', exam_date: '2024-11-15' },
        { id: 17, student_id: 6, course_id: 2, semester: '2024-1', score: 90.0, grade_level: 'A', exam_date: '2024-11-16' },
        { id: 18, student_id: 6, course_id: 3, semester: '2024-1', score: 86.5, grade_level: 'B', exam_date: '2024-11-17' },
        // 学生 7 的成绩
        { id: 19, student_id: 7, course_id: 1, semester: '2024-1', score: 91.0, grade_level: 'A', exam_date: '2024-11-15' },
        { id: 20, student_id: 7, course_id: 2, semester: '2024-1', score: 87.5, grade_level: 'B', exam_date: '2024-11-16' },
        { id: 21, student_id: 7, course_id: 3, semester: '2024-1', score: 89.0, grade_level: 'B', exam_date: '2024-11-17' },
        // 学生 8 的成绩
        { id: 22, student_id: 8, course_id: 1, semester: '2024-1', score: 84.0, grade_level: 'B', exam_date: '2024-11-15' },
        { id: 23, student_id: 8, course_id: 2, semester: '2024-1', score: 86.5, grade_level: 'B', exam_date: '2024-11-16' },
        { id: 24, student_id: 8, course_id: 3, semester: '2024-1', score: 88.0, grade_level: 'B', exam_date: '2024-11-17' },
        // 学生 9 的成绩
        { id: 25, student_id: 9, course_id: 1, semester: '2024-1', score: 92.5, grade_level: 'A', exam_date: '2024-11-15' },
        { id: 26, student_id: 9, course_id: 2, semester: '2024-1', score: 90.0, grade_level: 'A', exam_date: '2024-11-16' },
        { id: 27, student_id: 9, course_id: 3, semester: '2024-1', score: 93.5, grade_level: 'A', exam_date: '2024-11-17' },
        // 学生 10 的成绩
        { id: 28, student_id: 10, course_id: 1, semester: '2024-1', score: 85.5, grade_level: 'B', exam_date: '2024-11-15' },
        { id: 29, student_id: 10, course_id: 2, semester: '2024-1', score: 88.0, grade_level: 'B', exam_date: '2024-11-16' },
        { id: 30, student_id: 10, course_id: 3, semester: '2024-1', score: 87.0, grade_level: 'B', exam_date: '2024-11-17' },
      ]);

      console.log('[数据库服务] 业务数据插入完成');
    } catch (error) {
      console.error('[数据库服务] 业务数据插入失败:', error);
      throw error;
    }
  }
}
