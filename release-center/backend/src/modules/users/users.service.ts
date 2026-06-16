import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async create(data: any) {
    return this.prisma.user.create({ data });
  }

  async assignRole(userId: number, roleId: number) {
    return this.prisma.userRole.create({
      data: { userId, roleId }
    });
  }
}
