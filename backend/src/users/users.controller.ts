import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Request() req: { user: { id: string; email?: string } }) {
    return this.usersService.findOrCreate(req.user.id, req.user.email ?? '');
  }
}
