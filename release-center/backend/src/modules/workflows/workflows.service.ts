import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workflowDefinition.findMany();
  }

  async findOne(id: number) {
    return this.prisma.workflowDefinition.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.workflowDefinition.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.workflowDefinition.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.workflowDefinition.delete({ where: { id } });
  }
}