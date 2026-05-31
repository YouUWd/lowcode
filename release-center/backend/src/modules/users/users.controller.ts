import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    const data = await this.usersService.findAll();
    return { code: 0, message: 'success', data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.usersService.create(body);
    return { code: 0, message: 'success', data };
  }
}
