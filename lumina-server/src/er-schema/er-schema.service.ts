import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { Knex } from 'knex';

/**
 * ER Schema Service
 *
 * 管理 ER 图的元数据（表定义、字段定义、关系定义）
 * 使用 config.db 中的 er_table_meta / er_field_meta / er_relation_meta 三张表
 */

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface ErFieldRow {
  id: number;
  table_id: number;
  column_name: string;
  label: string;
  data_type: string;
}

export interface ErTableRow {
  id: number;
  table_name: string;
  display_name: string;
  primary_column: string;
}

export interface ErRelationRow {
  id: number;
  name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  relation_type: string;
}

export interface ErSchema {
  tables: ErTableDTO[];
  relations: ErRelationDTO[];
}

export interface ErTableDTO {
  id: number;
  tableName: string;
  displayName: string;
  primaryColumn: string;
  fields: ErFieldDTO[];
}

export interface ErFieldDTO {
  id: number;
  columnName: string;
  label: string;
  dataType: string;
}

export interface ErRelationDTO {
  id: number;
  name: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  relationType: string;
}

@Injectable()
export class ErSchemaService implements OnModuleInit {
  private readonly logger = new Logger(ErSchemaService.name);

  constructor(
    @Inject('CONFIG_DB') private readonly configDb: Knex,
    @Inject('BUSINESS_DB') private readonly businessDb: Knex,
  ) {}

  /**
   * 模块初始化时建表
   */
  async onModuleInit() {
    await this.ensureTables();
  }

  /**
   * 确保 er_table_meta / er_field_meta / er_relation_meta 表存在
   */
  private async ensureTables() {
    // er_table_meta
    const hasTableMeta = await this.configDb.schema.hasTable('er_table_meta');
    if (!hasTableMeta) {
      this.logger.log('创建 er_table_meta 表...');
      await this.configDb.schema.createTable('er_table_meta', (t) => {
        t.increments('id').primary();
        t.string('table_name', 128).notNullable().unique();
        t.string('display_name', 128).defaultTo('');
        t.string('primary_column', 64).defaultTo('id');
        t.timestamp('created_at').defaultTo(this.configDb.fn.now());
      });
    }

    // er_field_meta
    const hasFieldMeta = await this.configDb.schema.hasTable('er_field_meta');
    if (!hasFieldMeta) {
      this.logger.log('创建 er_field_meta 表...');
      await this.configDb.schema.createTable('er_field_meta', (t) => {
        t.increments('id').primary();
        t.integer('table_id').notNullable().references('id').inTable('er_table_meta').onDelete('CASCADE');
        t.string('column_name', 128).notNullable();
        t.string('label', 128).defaultTo('');
        t.string('data_type', 64).defaultTo('VARCHAR');
        t.timestamp('created_at').defaultTo(this.configDb.fn.now());
      });
    }

    // er_relation_meta
    const hasRelationMeta = await this.configDb.schema.hasTable('er_relation_meta');
    if (!hasRelationMeta) {
      this.logger.log('创建 er_relation_meta 表...');
      await this.configDb.schema.createTable('er_relation_meta', (t) => {
        t.increments('id').primary();
        t.string('name', 128).defaultTo('');
        t.string('source_table', 128).notNullable();
        t.string('source_column', 128).notNullable();
        t.string('target_table', 128).notNullable();
        t.string('target_column', 128).notNullable();
        t.string('relation_type', 32).defaultTo('ONE_TO_MANY');
        t.timestamp('created_at').defaultTo(this.configDb.fn.now());
      });
    }
  }

  /**
   * GET /api/er-schema — 加载完整 ER Schema
   * 如果 er_table_meta 为空，则自动从 business.db 的物理表反向工程填充
   */
  async getSchema(): Promise<ErSchema> {
    let tables = await this.configDb<ErTableRow>('er_table_meta').select('*');

    // 首次使用：自动导入 business.db 物理表结构
    if (tables.length === 0) {
      this.logger.log('首次加载，从 business.db 反向工程导入表结构...');
      await this.importFromBusinessDb();
      tables = await this.configDb<ErTableRow>('er_table_meta').select('*');
    }

    const result: ErTableDTO[] = [];
    for (const t of tables) {
      const fields = await this.configDb<ErFieldRow>('er_field_meta')
        .where('table_id', t.id)
        .select('*');

      result.push({
        id: t.id,
        tableName: t.table_name,
        displayName: t.display_name || '',
        primaryColumn: t.primary_column || 'id',
        fields: fields.map((f) => ({
          id: f.id,
          columnName: f.column_name,
          label: f.label || '',
          dataType: f.data_type || 'VARCHAR',
        })),
      });
    }

    const relations = await this.configDb<ErRelationRow>('er_relation_meta').select('*');

    return {
      tables: result,
      relations: relations.map((r) => ({
        id: r.id,
        name: r.name || '',
        sourceTable: r.source_table,
        sourceColumn: r.source_column,
        targetTable: r.target_table,
        targetColumn: r.target_column,
        relationType: r.relation_type || 'ONE_TO_MANY',
      })),
    };
  }

  /**
   * POST /api/er-schema — 全量保存 ER Schema
   */
  async saveSchema(schema: ErSchema): Promise<{ success: boolean }> {
    try {
      await this.configDb.transaction(async (trx) => {
        // 1. 清空旧数据
        await trx('er_field_meta').del();
        await trx('er_relation_meta').del();
        await trx('er_table_meta').del();

        // 2. 写入表和字段
        for (const table of schema.tables) {
          const [insertedId] = await trx('er_table_meta').insert({
            table_name: table.tableName,
            display_name: table.displayName || '',
            primary_column: table.primaryColumn || 'id',
          });

          const tableId = insertedId;

          for (const field of table.fields) {
            await trx('er_field_meta').insert({
              table_id: tableId,
              column_name: field.columnName,
              label: field.label || '',
              data_type: field.dataType || 'VARCHAR',
            });
          }
        }

        // 3. 写入关系
        for (const rel of schema.relations) {
          await trx('er_relation_meta').insert({
            name: rel.name || '',
            source_table: rel.sourceTable,
            source_column: rel.sourceColumn,
            target_table: rel.targetTable,
            target_column: rel.targetColumn,
            relation_type: rel.relationType || 'ONE_TO_MANY',
          });
        }
      });

      this.logger.log(`Schema 保存成功: ${schema.tables.length} 个表, ${schema.relations.length} 条关系`);
      return { success: true };
    } catch (error) {
      this.logger.error('保存 Schema 失败:', error);
      throw error;
    }
  }

  /**
   * 从 business.db 的物理表反向工程导入
   */
  private async importFromBusinessDb() {
    // 获取所有物理表
    const rawTables = await this.businessDb.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    );

    for (const row of rawTables) {
      const tableName = row.name;

      // 插入 table_meta
      const [tableId] = await this.configDb('er_table_meta').insert({
        table_name: tableName,
        display_name: '',
        primary_column: 'id',
      });

      // 获取字段信息
      const columns = await this.businessDb.raw(`PRAGMA table_info(${tableName})`);
      for (const col of columns) {
        await this.configDb('er_field_meta').insert({
          table_id: tableId,
          column_name: col.name,
          label: '',
          data_type: col.type || 'TEXT',
        });

        // 检测主键
        if (col.pk === 1) {
          await this.configDb('er_table_meta')
            .where('id', tableId)
            .update({ primary_column: col.name });
        }
      }

      // 获取外键信息，自动生成关系
      const foreignKeys = await this.businessDb.raw(`PRAGMA foreign_key_list(${tableName})`);
      for (const fk of foreignKeys) {
        await this.configDb('er_relation_meta').insert({
          name: `${tableName} → ${fk.table}`,
          source_table: tableName,
          source_column: fk.from,
          target_table: fk.table,
          target_column: fk.to,
          relation_type: 'MANY_TO_ONE',
        });
      }
    }

    this.logger.log('反向工程导入完成');
  }
}
