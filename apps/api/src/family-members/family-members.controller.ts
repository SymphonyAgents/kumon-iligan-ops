import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthedRequest } from '../auth/auth.types.js';
import { FamilyMembersService } from './family-members.service.js';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto.js';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto.js';

@Controller('families/:familyId/members')
@UseGuards(AuthGuard)
export class FamilyMembersController {
 constructor(private readonly service: FamilyMembersService) {}

 @Get()
 list(@Param('familyId') familyId: string, @Req() req: AuthedRequest) {
 return this.service.listByFamily(familyId, req.user.id);
 }

 @Post()
 create(
 @Param('familyId') familyId: string,
 @Body() dto: CreateFamilyMemberDto,
 @Req() req: AuthedRequest,
 ) {
 return this.service.create(familyId, dto, req.user.id);
 }

 @Patch(':memberId')
 update(
 @Param('familyId') familyId: string,
 @Param('memberId') memberId: string,
 @Body() dto: UpdateFamilyMemberDto,
 @Req() req: AuthedRequest,
 ) {
 return this.service.update(familyId, memberId, dto, req.user.id);
 }

 @Delete(':memberId')
 remove(
 @Param('familyId') familyId: string,
 @Param('memberId') memberId: string,
 @Req() req: AuthedRequest,
 ) {
 return this.service.remove(familyId, memberId, req.user.id);
 }
}
