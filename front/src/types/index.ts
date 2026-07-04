/** 与后端 API 交互规范文档一一对应的类型定义 */

export interface Result<T> {
  code: number
  message: string
  data: T
}

export type QueryType = 'MAIN' | 'SUB' | 'JOIN'
export type DataType = 'BIGINT' | 'VARCHAR' | 'DECIMAL' | 'INTEGER' | 'DATETIME'
export type QueryOp = 'EQ' | 'LIKE' | 'GT' | 'LT' | 'GE' | 'LE' | null

export interface FieldMeta {
  id: number
  columnName: string
  label: string
  dataType: DataType
  queryOp: QueryOp
}

export interface TableMeta {
  id: number
  tableName: string
  queryType: QueryType
  joinType: 'LEFT' | 'INNER' | null
  joinOn: string | null
  foreignKey: string | null
  fields: FieldMeta[]
}

export interface RelationMeta {
  id: number
  name: string
  leftTable: string
  rightTable: string
  junctionTable: string
  leftFk: string
  rightFk: string
  leftJoinColumn: string
  rightJoinColumn: string
}

export interface ModuleMeta {
  id: string
  name: string
  description: string
  mainTable: TableMeta
  subTables: TableMeta[]
  joinTables: TableMeta[]
  relations: RelationMeta[]
}

/** 数据引擎查询 */
export interface QueryFilter {
  tableName: string
  field: string
  op: string
  value: unknown
}

export interface QuerySort {
  field: string
  dir: 'ASC' | 'DESC'
}

export interface QueryWith {
  tableName: string
  fields: string[]
}

export interface QueryRequest {
  id?: number
  page: number
  size: number
  filters: QueryFilter[]
  sorts: QuerySort[]
  with: QueryWith[]
}

export interface PageResult {
  rows: Record<string, unknown>[]
  total: number
  page: number
  size: number
}

/** 权限配置 */
export interface PermField {
  fieldMetaId: number
  columnName: string
  label: string
  perm: number
}

export interface PermTable {
  tableMetaId: number
  tableName: string
  fields: PermField[]
}

export interface PermBatchRequest {
  roleCode: string
  moduleId: string
  tables: {
    tableMetaId: number
    fields: { fieldMetaId: number; perm: number }[]
  }[]
}
