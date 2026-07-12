import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { DiagramService } from './diagram.service';
import type { DiagramSchema } from './diagram.service';

@Controller('diagram')
export class DiagramController {
  private readonly logger = new Logger(DiagramController.name);

  constructor(private readonly diagramService: DiagramService) {}

  @Get()
  async getSchema(): Promise<DiagramSchema> {
    this.logger.log('获取 Diagram Schema');
    return this.diagramService.getSchema();
  }

  @Post()
  async saveSchema(@Body() schema: DiagramSchema): Promise<{ success: boolean }> {
    this.logger.log(`保存 Diagram Schema: ${schema.tables?.length ?? 0} 个表, ${schema.relations?.length ?? 0} 条关系`);
    return this.diagramService.saveSchema(schema);
  }
}
