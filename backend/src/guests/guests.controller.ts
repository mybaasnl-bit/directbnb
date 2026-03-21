import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { GuestsService, UpdateGuestDto } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('guests')
@Controller('guests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiOperation({ summary: 'Manually create a guest' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateGuestDto) {
    return this.guestsService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all guests, with optional search' })
  findAll(
    @CurrentUser('id') ownerId: string,
    @Query('search') search?: string,
  ) {
    return this.guestsService.findAllByOwner(ownerId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single guest with booking history' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.guestsService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update guest profile' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateGuestDto,
  ) {
    return this.guestsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a guest' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.guestsService.remove(id, ownerId);
  }
}
