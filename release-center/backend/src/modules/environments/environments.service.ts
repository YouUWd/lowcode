import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.environment.findMany();
  }

  async findOne(id: number) {
    return this.prisma.environment.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.environment.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.environment.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.environment.delete({ where: { id } });
  }
}