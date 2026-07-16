export class QueryFilter {
  tableName: string;
  field: string;
  op: string; // 'like', '=', '>', '<', etc.
  value: any;
}

export class QuerySort {
  field: string; // formats can be 'fieldName' or 'tableName_fieldName'
  dir: 'ASC' | 'DESC';
}

export class QueryWith {
  tableName: string;
  fields?: string[];
}

export class QueryPayload {
  id?: number | string; // If present, Detail Mode
  page?: number;
  size?: number;
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  with?: QueryWith[];
}

export class SavePayload {
  data: Record<string, any>;
}
