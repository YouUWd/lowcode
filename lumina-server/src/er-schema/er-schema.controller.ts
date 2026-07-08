import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ErSchemaService } from './er-schema.service';
import type { ErSchema } from './er-schema.service';

@Controller('er-schema')
export class ErSchemaController {
  private readonly logger = new Logger(ErSchemaController.name);

  constructor(private readonly erSchemaService: ErSchemaService) {}

  /**
   * GET /api/er-schema
   * 获取完整的 ER Schema（表 + 字段 + 关系）
   */
  @Get()
  async getSchema(): Promise<ErSchema> {
    this.logger.log('获取 ER Schema');
    return this.erSchemaService.getSchema();
  }

  /**
   * POST /api/er-schema
   * 全量保存 ER Schema
   */
  @Post()
  async saveSchema(@Body() schema: ErSchema): Promise<{ success: boolean }> {
    this.logger.log(`保存 ER Schema: ${schema.tables?.length ?? 0} 个表, ${schema.relations?.length ?? 0} 条关系`);
    return this.erSchemaService.saveSchema(schema);
  }
}
