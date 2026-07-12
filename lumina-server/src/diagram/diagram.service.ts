import { Injectable, Inject, Logger } from '@nestjs/common';
import { Knex } from 'knex';

export interface FieldMetaRow {
  id: number;
  table_meta_id: number;
  column_name: string;
  label: string;
  data_type: string;
}

export interface TableMetaRow {
  id: number;
  table_name: string;
  display_name: string;
  primary_column: string;
}

export interface RelationRow {
  id: number;
  name: string;
}

export interface RelationFieldMetaRow {
  relation_id: number;
  field_meta_id: number;
  cardinality: '1' | 'N';
}

export interface RelationNode {
  fieldId: number;
  tableName: string;
  columnName: string;
  cardinality: '1' | 'N';
}

export interface DiagramRelationDTO {
  id: number;
  name: string;
  nodes: RelationNode[];
}

export interface DiagramFieldDTO {
  id: number;
  columnName: string;
  label: string;
  dataType: string;
}

export interface DiagramTableDTO {
  id: number;
  tableName: string;
  displayName: string;
  primaryColumn: string;
  fields: DiagramFieldDTO[];
}

export interface DiagramSchema {
  tables: DiagramTableDTO[];
  relations: DiagramRelationDTO[];
}

@Injectable()
export class DiagramService {
  private readonly logger = new Logger(DiagramService.name);

  constructor(
    @Inject('CONFIG_DB') private readonly configDb: Knex,
  ) {}

  async getSchema(): Promise<DiagramSchema> {
    const tables = await this.configDb<TableMetaRow>('table_meta').orderBy('id', 'asc').select('*');

    const result: DiagramTableDTO[] = [];
    for (const t of tables) {
      const fields = await this.configDb<FieldMetaRow>('field_meta')
        .where('table_meta_id', t.id)
        .orderBy('id', 'asc')
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

    const relations = await this.configDb<RelationRow>('relation').orderBy('id', 'asc').select('*');
    const relationNodesMap = new Map<number, RelationNode[]>();

    const relationFields = await this.configDb('relation_field_meta')
      .join('field_meta', 'relation_field_meta.field_meta_id', '=', 'field_meta.id')
      .join('table_meta', 'field_meta.table_meta_id', '=', 'table_meta.id')
      .select(
        'relation_field_meta.relation_id',
        'relation_field_meta.field_meta_id',
        'relation_field_meta.cardinality',
        'field_meta.column_name',
        'table_meta.table_name'
      );

    for (const rf of relationFields) {
      const nodes = relationNodesMap.get(rf.relation_id) || [];
      nodes.push({
        fieldId: rf.field_meta_id,
        tableName: rf.table_name,
        columnName: rf.column_name,
        cardinality: rf.cardinality,
      });
      relationNodesMap.set(rf.relation_id, nodes);
    }

    return {
      tables: result,
      relations: relations.map((r) => ({
        id: r.id,
        name: r.name || '',
        nodes: relationNodesMap.get(r.id) || [],
      })),
    };
  }

  async saveSchema(schema: DiagramSchema): Promise<{ success: boolean }> {
    try {
      await this.configDb.transaction(async (trx) => {
        // 更新表和字段 (不可删除，因为存在外键依赖如 field_permission, module_table_meta)
        for (const table of schema.tables) {
          if (table.id && table.id > 0) {
            await trx('table_meta').where('id', table.id).update({
              display_name: table.displayName || '',
              primary_column: table.primaryColumn || 'id',
            });
            
            for (const field of table.fields) {
              if (field.id && field.id > 0) {
                await trx('field_meta').where('id', field.id).update({
                  label: field.label || '',
                  data_type: field.dataType || 'VARCHAR',
                });
              } else {
                await trx('field_meta').insert({
                  table_meta_id: table.id,
                  column_name: field.columnName,
                  label: field.label || '',
                  data_type: field.dataType || 'VARCHAR',
                });
              }
            }
          }
        }

        // 清除旧的关系数据
        await trx('relation_field_meta').del();
        await trx('relation').del();

        // 重新插入关系数据
        for (const rel of schema.relations) {
          const [insertedId] = await trx('relation').insert({
            name: rel.name || '',
          });

          for (const node of rel.nodes) {
            await trx('relation_field_meta').insert({
              relation_id: insertedId,
              field_meta_id: node.fieldId,
              cardinality: node.cardinality,
            });
          }
        }
      });

      this.logger.log(`Schema 保存成功`);
      return { success: true };
    } catch (error) {
      this.logger.error('保存 Schema 失败:', error);
      throw error;
    }
  }
}
