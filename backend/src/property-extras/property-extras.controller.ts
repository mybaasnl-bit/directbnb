import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PropertyExtrasService } from './property-extras.service';
import { CreatePropertyExtraDto } from './dto/create-property-extra.dto';
import { UpdatePropertyExtraDto } from './dto/update-property-extra.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('property-extras')
@Controller()
@UseGuards(JwtAuthGuard)
export class PropertyExtrasController {
  constructor(private readonly service: PropertyExtrasService) {}

  // ─── Authenticated (owner) ────────────────────────────────────────────────

  @Get('properties/:propertyId/extras')
  @ApiBearerAuth()
  findAll(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.service.findAll(propertyId, ownerId);
  }

  @Post('properties/:propertyId/extras')
  @ApiBearerAuth()
  create(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreatePropertyExtraDto,
  ) {
    return this.service.create(propertyId, ownerId, dto);
  }

  @Patch('properties/:propertyId/extras/:extraId')
  @ApiBearerAuth()
  update(
    @Param('propertyId') propertyId: string,
    @Param('extraId') extraId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdatePropertyExtraDto,
  ) {
    return this.service.update(propertyId, extraId, ownerId, dto);
  }

  @Delete('properties/:propertyId/extras/:extraId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('propertyId') propertyId: string,
    @Param('extraId') extraId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.service.remove(propertyId, extraId, ownerId);
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  @Public()
  @Get('public/properties/:propertyId/extras')
  findPublic(@Param('propertyId') propertyId: string) {
    return this.service.findPublic(propertyId);
  }
}
