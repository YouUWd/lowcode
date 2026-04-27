import { Injectable } from '@nestjs/common';

export type TransformerEnv = 'none' | 'backend' | 'frontend';

export interface Mapping {
  displayName: string;
  logicalField: string;
  physicalFields: Array<{
    entity: string;
    name: string;
  }>;
  transformer: string | null;
  transformerEnv: TransformerEnv;
  renderIcon: string;
  renderType: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  desc: string;
  entity: string;
  count: number;
  active: boolean;
  primaryEntity: {
    name: string;
    desc: string;
  };
  entities: Array<{
    id: string;
    name: string;
    desc: string;
    status: string;
    joinCondition: {
      left: string;
      right: string;
    };
  }>;
  mappings: Mapping[];
}

@Injectable()
export class ModulesService {
  private modules: Map<string, ModuleConfig> = new Map();

  constructor() {
    this.initializeModules();
  }

  private initializeModules() {
    const modulesData = [
      {
        id: 'MOD-SYS-LOG',
        name: '系统操作日志',
        desc: '记录系统内所有的用户操作轨迹与流水',
        entity: 'sys_operation_log',
        count: 0,
        active: false,
        primaryEntity: {
          name: 'sys_operation_log',
          desc: '系统操作日志表，纯单表流水记录，无任何物理连表关系',
        },
        entities: [],
        mappings: [
          {
            displayName: '操作人',
            logicalField: 'operator',
            physicalFields: [{ entity: 'sys_operation_log', name: 'operator_name' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'person',
            renderType: 'Text',
          },
          {
            displayName: '操作类型',
            logicalField: 'actionType',
            physicalFields: [{ entity: 'sys_operation_log', name: 'action_type' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'touch_app',
            renderType: 'Tag',
          },
          {
            displayName: '操作时间',
            logicalField: 'createdAt',
            physicalFields: [{ entity: 'sys_operation_log', name: 'created_at' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'schedule',
            renderType: 'Text',
          },
        ],
      },
      {
        id: 'MOD-HR-ORG',
        name: '组织架构管理',
        desc: '管理企业组织树、部门编制及汇报线关系',
        entity: 'hr_organization',
        count: 4,
        active: true,
        primaryEntity: {
          name: 'hr_organization',
          desc: '组织单元主表，存储公司、部门、组的层级与基础信息',
        },
        entities: [
          {
            id: '1',
            name: 'hr_org_hierarchy',
            desc: '组织树状层级关系 (Closure Table)',
            status: '正常',
            joinCondition: { left: 'org_code', right: 'ancestor_code' },
          },
          {
            id: '2',
            name: 'hr_position',
            desc: '标准岗位编制池',
            status: '正常',
            joinCondition: { left: 'id', right: 'org_id' },
          },
          {
            id: '3',
            name: 'sys_user',
            desc: '组织负责人账户引用',
            status: '正常',
            joinCondition: { left: 'id', right: 'manager_id' },
          },
          {
            id: '4',
            name: 'hr_cost_center',
            desc: '财务成本中心关联',
            status: '正常',
            joinCondition: { left: 'cost_center_id', right: 'id' },
          },
        ],
        mappings: [
          {
            displayName: '组织编码',
            logicalField: 'orgCode',
            physicalFields: [{ entity: 'hr_organization', name: 'org_code' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'tag',
            renderType: 'Text',
          },
          {
            displayName: '组织名称',
            logicalField: 'orgName',
            physicalFields: [{ entity: 'hr_organization', name: 'org_name' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'corporate_fare',
            renderType: 'Text',
          },
          {
            displayName: '组织类型',
            logicalField: 'orgType',
            physicalFields: [{ entity: 'hr_organization', name: 'org_type' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'account_tree',
            renderType: 'Tag',
          },
          {
            displayName: '负责人标识',
            logicalField: 'managerDesc',
            physicalFields: [
              { entity: 'sys_user', name: 'real_name' },
              { entity: 'sys_user', name: 'emp_no' },
            ],
            transformer: "CONCAT(${real_name}, ' (', ${emp_no}, ')')",
            transformerEnv: 'backend' as const,
            renderIcon: 'person',
            renderType: 'Link',
          },
          {
            displayName: '编制情况',
            logicalField: 'headcountStatus',
            physicalFields: [
              { entity: 'hr_organization', name: 'headcount' },
              { entity: 'hr_organization', name: 'max_headcount' },
            ],
            transformer: 'ASSEMBLE_FRACTION(${headcount}, ${max_headcount})',
            transformerEnv: 'frontend' as const,
            renderIcon: 'groups',
            renderType: 'Badge',
          },
          {
            displayName: '生效日期',
            logicalField: 'effectiveDate',
            physicalFields: [{ entity: 'hr_organization', name: 'effective_date' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'calendar_today',
            renderType: 'Text',
          },
        ],
      },
      {
        id: 'MOD-HR-EMP',
        name: '员工核心档案',
        desc: '维护员工基础信息、教育经历及生命周期',
        entity: 'hr_employee_base',
        count: 8,
        active: true,
        primaryEntity: {
          name: 'hr_employee_base',
          desc: '员工主表，包含不可变的基础身份与生命周期状态',
        },
        entities: [
          {
            id: '1',
            name: 'hr_emp_job',
            desc: '员工任职信息 (关联岗位、职级、部门)',
            status: '正常',
            joinCondition: { left: 'emp_id', right: 'id' },
          },
          {
            id: '2',
            name: 'hr_emp_personal',
            desc: '隐私信息 (身份证、银行卡等加密字段)',
            status: '正常',
            joinCondition: { left: 'emp_id', right: 'id' },
          },
          {
            id: '3',
            name: 'hr_emp_contract',
            desc: '劳动合同及试用期流转历程',
            status: '正常',
            joinCondition: { left: 'emp_id', right: 'id' },
          },
          {
            id: '4',
            name: 'hr_emp_education',
            desc: '教育经历与学历证书',
            status: '正常',
            joinCondition: { left: 'emp_id', right: 'id' },
          },
          {
            id: '5',
            name: 'hr_organization',
            desc: '关联部门基础信息',
            status: '正常',
            joinCondition: { left: 'id', right: 'dept_id' },
          },
        ],
        mappings: [
          {
            displayName: '工号',
            logicalField: 'empNo',
            physicalFields: [{ entity: 'hr_employee_base', name: 'emp_no' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'badge',
            renderType: 'Text',
          },
          {
            displayName: '英文全名',
            logicalField: 'fullNameEng',
            physicalFields: [
              { entity: 'hr_employee_base', name: 'first_name' },
              { entity: 'hr_employee_base', name: 'last_name' },
            ],
            transformer: "CONCAT(${first_name}, ' ', ${last_name})",
            transformerEnv: 'backend' as const,
            renderIcon: 'person',
            renderType: 'Text',
          },
          {
            displayName: '证件号码',
            logicalField: 'idNumber',
            physicalFields: [{ entity: 'hr_emp_personal', name: 'id_card_no' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'pin',
            renderType: 'Text',
          },
          {
            displayName: '员工类型',
            logicalField: 'empType',
            physicalFields: [{ entity: 'hr_emp_job', name: 'emp_type' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'work',
            renderType: 'Tag',
          },
          {
            displayName: '任职部门',
            logicalField: 'deptName',
            physicalFields: [{ entity: 'hr_organization', name: 'org_name' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'corporate_fare',
            renderType: 'Link',
          },
          {
            displayName: '在职状态',
            logicalField: 'empStatus',
            physicalFields: [{ entity: 'hr_employee_base', name: 'status' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'fiber_manual_record',
            renderType: 'Status',
          },
        ],
      },
      {
        id: 'MOD-HR-PAY',
        name: '薪酬核算中心',
        desc: '处理薪金、社保公积金及个税等复杂计算',
        entity: 'hr_payroll_result',
        count: 12,
        active: true,
        primaryEntity: {
          name: 'hr_payroll_result',
          desc: '员工个人的核算期薪资发放结果明细',
        },
        entities: [
          {
            id: '1',
            name: 'hr_salary_structure',
            desc: '应用薪资套账与结构化规则',
            status: '正常',
            joinCondition: { left: 'id', right: 'structure_id' },
          },
          {
            id: '2',
            name: 'hr_payroll_element',
            desc: '单项薪资条目 (基本工资, 绩效, 奖金等)',
            status: '正常',
            joinCondition: { left: 'result_id', right: 'id' },
          },
          {
            id: '3',
            name: 'hr_social_security_record',
            desc: '当期五险一金扣缴明细及基数快照',
            status: '正常',
            joinCondition: { left: 'result_id', right: 'id' },
          },
          {
            id: '4',
            name: 'hr_tax_record',
            desc: '当期个税专项附加扣除与应纳税明细',
            status: '正常',
            joinCondition: { left: 'result_id', right: 'id' },
          },
        ],
        mappings: [
          {
            displayName: '计薪周期',
            logicalField: 'period',
            physicalFields: [
              { entity: 'hr_payroll_result', name: 'payroll_year' },
              { entity: 'hr_payroll_result', name: 'payroll_month' },
            ],
            transformer: "CONCAT(${payroll_year}, '-', ${payroll_month})",
            transformerEnv: 'backend' as const,
            renderIcon: 'calendar_month',
            renderType: 'Text',
          },
          {
            displayName: '应发合计',
            logicalField: 'grossPay',
            physicalFields: [{ entity: 'hr_payroll_result', name: 'gross_amount' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'account_balance_wallet',
            renderType: 'Text',
          },
          {
            displayName: '社保代扣',
            logicalField: 'socialDeduction',
            physicalFields: [{ entity: 'hr_social_security_record', name: 'total_personal_deduct' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'health_and_safety',
            renderType: 'Text',
          },
          {
            displayName: '个税代扣',
            logicalField: 'taxDeduction',
            physicalFields: [{ entity: 'hr_tax_record', name: 'tax_amount' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'receipt_long',
            renderType: 'Text',
          },
          {
            displayName: '实发薪资',
            logicalField: 'netPay',
            physicalFields: [{ entity: 'hr_payroll_result', name: 'net_amount' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'payments',
            renderType: 'Badge',
          },
          {
            displayName: '发放状态',
            logicalField: 'status',
            physicalFields: [{ entity: 'hr_payroll_result', name: 'payment_status' }],
            transformer: null,
            transformerEnv: 'none' as const,
            renderIcon: 'fiber_manual_record',
            renderType: 'Status',
          },
        ],
      },
    ];

    modulesData.forEach((mod) => {
      this.modules.set(mod.id, mod);
    });
  }

  getAllModules(): ModuleConfig[] {
    return Array.from(this.modules.values());
  }

  getModuleById(id: string): ModuleConfig | undefined {
    return this.modules.get(id);
  }

  getModuleConfig(id: string) {
    const module = this.modules.get(id);
    if (!module) return null;

    return {
      primaryEntity: module.primaryEntity,
      entities: module.entities,
      mappings: module.mappings,
    };
  }
}
