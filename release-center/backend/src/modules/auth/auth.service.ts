import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: any) {
    const { username, password } = loginDto;
    // Mock login for MVP
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user || user.password !== password) {
      // Auto-create for MVP testing if it doesn't exist
      if (!user && username === 'admin' && password === 'admin') {
         const newUser = await this.prisma.user.create({
            data: { username: 'admin', password: 'admin' }
         });
         return {
           access_token: this.jwtService.sign({ sub: newUser.id, username: newUser.username, permissions: [] }),
         };
      }
      throw new UnauthorizedException();
    }

    const permissions = user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.name));

    return {
      access_token: this.jwtService.sign({ sub: user.id, username: user.username, permissions }),
    };
  }
}
