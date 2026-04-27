import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async initializeDatabase() {
    // Create all tables
    await this.createTables();
    // Seed mock data
    await this.seedMockData();
  }

  private async createTables() {
    // hr_organization
    if (!(await this.knex.schema.hasTable('hr_organization'))) {
      await this.knex.schema.createTable('hr_organization', (table) => {
        table.increments('id').primary();
        table.string('org_code').unique();
        table.string('org_name');
        table.string('org_type');
        table.integer('headcount').defaultTo(0);
        table.integer('max_headcount').defaultTo(100);
        table.date('effective_date');
        table.string('ancestor_code').nullable();
        table.integer('manager_id').nullable();
        table.integer('cost_center_id').nullable();
        table.timestamps(true, true);
      });
    }

    // hr_employee_base
    if (!(await this.knex.schema.hasTable('hr_employee_base'))) {
      await this.knex.schema.createTable('hr_employee_base', (table) => {
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

    // hr_emp_job
    if (!(await this.knex.schema.hasTable('hr_emp_job'))) {
      await this.knex.schema.createTable('hr_emp_job', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.integer('dept_id');
        table.string('job_title');
        table.string('emp_type');
        table.timestamps(true, true);
      });
    }

    // hr_emp_personal
    if (!(await this.knex.schema.hasTable('hr_emp_personal'))) {
      await this.knex.schema.createTable('hr_emp_personal', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.string('id_card_no');
        table.string('bank_account').nullable();
        table.timestamps(true, true);
      });
    }

    // hr_emp_contract
    if (!(await this.knex.schema.hasTable('hr_emp_contract'))) {
      await this.knex.schema.createTable('hr_emp_contract', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.string('contract_type');
        table.date('end_date').nullable();
        table.timestamps(true, true);
      });
    }

    // hr_emp_education
    if (!(await this.knex.schema.hasTable('hr_emp_education'))) {
      await this.knex.schema.createTable('hr_emp_education', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.string('degree');
        table.string('university');
        table.timestamps(true, true);
      });
    }

    // hr_payroll_result
    if (!(await this.knex.schema.hasTable('hr_payroll_result'))) {
      await this.knex.schema.createTable('hr_payroll_result', (table) => {
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

    // hr_salary_structure
    if (!(await this.knex.schema.hasTable('hr_salary_structure'))) {
      await this.knex.schema.createTable('hr_salary_structure', (table) => {
        table.increments('id').primary();
        table.string('structure_code');
        table.decimal('base_salary', 10, 2);
        table.decimal('allowance', 10, 2).defaultTo(0);
        table.timestamps(true, true);
      });
    }

    // hr_payroll_element
    if (!(await this.knex.schema.hasTable('hr_payroll_element'))) {
      await this.knex.schema.createTable('hr_payroll_element', (table) => {
        table.increments('id').primary();
        table.integer('result_id');
        table.string('element_code');
        table.decimal('element_amount', 10, 2);
        table.timestamps(true, true);
      });
    }

    // hr_social_security_record
    if (!(await this.knex.schema.hasTable('hr_social_security_record'))) {
      await this.knex.schema.createTable('hr_social_security_record', (table) => {
        table.increments('id').primary();
        table.integer('result_id');
        table.decimal('total_personal_deduct', 10, 2);
        table.decimal('total_company_deduct', 10, 2);
        table.timestamps(true, true);
      });
    }

    // hr_tax_record
    if (!(await this.knex.schema.hasTable('hr_tax_record'))) {
      await this.knex.schema.createTable('hr_tax_record', (table) => {
        table.increments('id').primary();
        table.integer('result_id');
        table.decimal('tax_amount', 10, 2);
        table.decimal('taxable_income', 10, 2);
        table.timestamps(true, true);
      });
    }

    // hr_perf_appraisal
    if (!(await this.knex.schema.hasTable('hr_perf_appraisal'))) {
      await this.knex.schema.createTable('hr_perf_appraisal', (table) => {
        table.increments('id').primary();
        table.integer('emp_id');
        table.integer('plan_id');
        table.decimal('self_eval_score', 5, 2).nullable();
        table.decimal('manager_eval_score', 5, 2).nullable();
        table.string('final_grade').nullable();
        table.string('workflow_status');
        table.timestamps(true, true);
      });
    }

    // hr_perf_plan
    if (!(await this.knex.schema.hasTable('hr_perf_plan'))) {
      await this.knex.schema.createTable('hr_perf_plan', (table) => {
        table.increments('id').primary();
        table.string('plan_name');
        table.date('start_date');
        table.date('end_date');
        table.timestamps(true, true);
      });
    }

    // hr_perf_kpi
    if (!(await this.knex.schema.hasTable('hr_perf_kpi'))) {
      await this.knex.schema.createTable('hr_perf_kpi', (table) => {
        table.increments('id').primary();
        table.integer('appraisal_id');
        table.string('kpi_name');
        table.decimal('weight', 5, 2);
        table.timestamps(true, true);
      });
    }

    // hr_perf_eval_flow
    if (!(await this.knex.schema.hasTable('hr_perf_eval_flow'))) {
      await this.knex.schema.createTable('hr_perf_eval_flow', (table) => {
        table.increments('id').primary();
        table.integer('appraisal_id');
        table.string('node_name');
        table.integer('evaluator_id');
        table.timestamps(true, true);
      });
    }

    // hr_job_requisition
    if (!(await this.knex.schema.hasTable('hr_job_requisition'))) {
      await this.knex.schema.createTable('hr_job_requisition', (table) => {
        table.increments('id').primary();
        table.string('req_code').unique();
        table.string('job_title');
        table.string('city');
        table.string('district');
        table.string('priority_level');
        table.string('req_status');
        table.integer('headcount_required');
        table.timestamps(true, true);
      });
    }

    // hr_candidate_application
    if (!(await this.knex.schema.hasTable('hr_candidate_application'))) {
      await this.knex.schema.createTable('hr_candidate_application', (table) => {
        table.increments('id').primary();
        table.integer('req_id');
        table.string('candidate_name');
        table.string('resume_url').nullable();
        table.timestamps(true, true);
      });
    }

    // hr_interview_schedule
    if (!(await this.knex.schema.hasTable('hr_interview_schedule'))) {
      await this.knex.schema.createTable('hr_interview_schedule', (table) => {
        table.increments('id').primary();
        table.integer('req_id');
        table.dateTime('interview_time');
        table.integer('interviewer_id');
        table.timestamps(true, true);
      });
    }

    // hr_offer_approval
    if (!(await this.knex.schema.hasTable('hr_offer_approval'))) {
      await this.knex.schema.createTable('hr_offer_approval', (table) => {
        table.increments('id').primary();
        table.integer('req_id');
        table.string('offer_status');
        table.decimal('salary_offer', 10, 2);
        table.timestamps(true, true);
      });
    }

    // sys_operation_log
    if (!(await this.knex.schema.hasTable('sys_operation_log'))) {
      await this.knex.schema.createTable('sys_operation_log', (table) => {
        table.increments('id').primary();
        table.string('operator_name');
        table.string('action_type');
        table.string('ip_address').nullable();
        table.timestamps(true, true);
      });
    }

    // sys_user
    if (!(await this.knex.schema.hasTable('sys_user'))) {
      await this.knex.schema.createTable('sys_user', (table) => {
        table.increments('id').primary();
        table.string('username').unique();
        table.string('real_name');
        table.string('emp_no');
        table.integer('dept_id');
        table.string('status');
        table.timestamps(true, true);
      });
    }

    // hr_org_hierarchy
    if (!(await this.knex.schema.hasTable('hr_org_hierarchy'))) {
      await this.knex.schema.createTable('hr_org_hierarchy', (table) => {
        table.increments('id').primary();
        table.string('org_code');
        table.string('ancestor_code');
        table.integer('depth');
        table.timestamps(true, true);
      });
    }

    // hr_position
    if (!(await this.knex.schema.hasTable('hr_position'))) {
      await this.knex.schema.createTable('hr_position', (table) => {
        table.increments('id').primary();
        table.integer('org_id');
        table.string('position_code');
        table.string('position_name');
        table.timestamps(true, true);
      });
    }

    // hr_cost_center
    if (!(await this.knex.schema.hasTable('hr_cost_center'))) {
      await this.knex.schema.createTable('hr_cost_center', (table) => {
        table.increments('id').primary();
        table.string('cost_center_code');
        table.string('cost_center_name');
        table.timestamps(true, true);
      });
    }

    // sys_permission_config - 全局权限配置表
    if (!(await this.knex.schema.hasTable('sys_permission_config'))) {
      await this.knex.schema.createTable('sys_permission_config', (table) => {
        table.increments('id').primary();
        table.string('permission_node').unique(); // 格式: {entity}.{fieldName}.{operationType}
        table.string('entity'); // 表名
        table.string('field_name'); // 字段名
        table.string('operation_type'); // SELECT, UPDATE, WRITE
        table.string('description').nullable(); // 权限描述
        table.boolean('enabled').defaultTo(true); // 是否启用
        table.timestamps(true, true);
      });
    }
  }

  private async seedMockData() {
    // Check if data already exists
    const orgCount = await this.knex('hr_organization').count('* as count').first();
    if (orgCount && (orgCount.count as number) > 0) return;

    // Seed organizations
    await this.knex('hr_organization').insert([
      {
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

    // Seed users
    await this.knex('sys_user').insert([
      {
        username: 'admin',
        real_name: '管理员',
        emp_no: 'EMP-0001',
        dept_id: 1,
        status: '1',
      },
      {
        username: 'hr_manager',
        real_name: '李经理',
        emp_no: 'EMP-0002',
        dept_id: 2,
        status: '1',
      },
      {
        username: 'finance_manager',
        real_name: '王经理',
        emp_no: 'EMP-0003',
        dept_id: 3,
        status: '1',
      },
    ]);

    // Seed employees
    await this.knex('hr_employee_base').insert([
      {
        emp_no: 'EMP-0001',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        dept_id: 1,
        status: '1',
      },
      {
        emp_no: 'EMP-0002',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        dept_id: 2,
        status: '1',
      },
      {
        emp_no: 'EMP-0003',
        first_name: 'Bob',
        last_name: 'Johnson',
        full_name: 'Bob Johnson',
        dept_id: 3,
        status: '1',
      },
      {
        emp_no: 'EMP-0004',
        first_name: 'Alice',
        last_name: 'Williams',
        full_name: 'Alice Williams',
        dept_id: 2,
        status: '1',
      },
    ]);

    // Seed employee jobs
    await this.knex('hr_emp_job').insert([
      { emp_id: 1, dept_id: 1, job_title: 'CEO', emp_type: 'FULL_TIME' },
      { emp_id: 2, dept_id: 2, job_title: 'HR Manager', emp_type: 'FULL_TIME' },
      { emp_id: 3, dept_id: 3, job_title: 'Finance Manager', emp_type: 'FULL_TIME' },
      { emp_id: 4, dept_id: 2, job_title: 'HR Specialist', emp_type: 'FULL_TIME' },
    ]);

    // Seed employee personal info
    await this.knex('hr_emp_personal').insert([
      { emp_id: 1, id_card_no: '110101199001011234', bank_account: '6222021234567890' },
      { emp_id: 2, id_card_no: '110101199101021234', bank_account: '6222021234567891' },
      { emp_id: 3, id_card_no: '110101199201031234', bank_account: '6222021234567892' },
      { emp_id: 4, id_card_no: '110101199301041234', bank_account: '6222021234567893' },
    ]);

    // Seed payroll data
    await this.knex('hr_salary_structure').insert([
      { structure_code: 'STR-001', base_salary: 15000, allowance: 2000 },
      { structure_code: 'STR-002', base_salary: 12000, allowance: 1500 },
    ]);

    await this.knex('hr_payroll_result').insert([
      {
        emp_id: 1,
        payroll_year: 2024,
        payroll_month: 1,
        gross_amount: 17000,
        net_amount: 14500,
        payment_status: '1',
        structure_id: 1,
      },
      {
        emp_id: 2,
        payroll_year: 2024,
        payroll_month: 1,
        gross_amount: 13500,
        net_amount: 11500,
        payment_status: '1',
        structure_id: 2,
      },
      {
        emp_id: 3,
        payroll_year: 2024,
        payroll_month: 1,
        gross_amount: 13500,
        net_amount: 11500,
        payment_status: '1',
        structure_id: 2,
      },
      {
        emp_id: 4,
        payroll_year: 2024,
        payroll_month: 1,
        gross_amount: 13500,
        net_amount: 11500,
        payment_status: '0',
        structure_id: 2,
      },
    ]);

    // Seed social security records
    await this.knex('hr_social_security_record').insert([
      { result_id: 1, total_personal_deduct: 1500, total_company_deduct: 2000 },
      { result_id: 2, total_personal_deduct: 1200, total_company_deduct: 1600 },
      { result_id: 3, total_personal_deduct: 1200, total_company_deduct: 1600 },
      { result_id: 4, total_personal_deduct: 1200, total_company_deduct: 1600 },
    ]);

    // Seed tax records
    await this.knex('hr_tax_record').insert([
      { result_id: 1, tax_amount: 1000, taxable_income: 15500 },
      { result_id: 2, tax_amount: 800, taxable_income: 12300 },
      { result_id: 3, tax_amount: 800, taxable_income: 12300 },
      { result_id: 4, tax_amount: 800, taxable_income: 12300 },
    ]);

    // Seed operation logs
    await this.knex('sys_operation_log').insert([
      {
        operator_name: 'admin',
        action_type: 'LOGIN',
        ip_address: '192.168.1.1',
      },
      {
        operator_name: 'hr_manager',
        action_type: 'VIEW_PAYROLL',
        ip_address: '192.168.1.2',
      },
    ]);
  }
}
