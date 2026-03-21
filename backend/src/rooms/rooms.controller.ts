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

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room for a property' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms for a property' })
  findAll(
    @CurrentUser('id') ownerId: string,
    @Query('propertyId', ParseUUIDPipe) propertyId: string,
  ) {
    return this.roomsService.findAllByProperty(propertyId, ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single room by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.roomsService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.roomsService.remove(id, ownerId);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Add a photo to a room' })
  addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() body: { url: string; altText?: string },
  ) {
    return this.roomsService.addPhoto(id, ownerId, body);
  }

  @Delete('photos/:photoId')
  @ApiOperation({ summary: 'Remove a room photo' })
  removePhoto(
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.roomsService.removePhoto(photoId, ownerId);
  }
}
