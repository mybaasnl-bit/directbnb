import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(ownerId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all properties for the current owner' })
  findAll(@CurrentUser('id') ownerId: string) {
    return this.propertiesService.findAllByOwner(ownerId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single property by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.propertiesService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a property' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.propertiesService.remove(id, ownerId);
  }

  @Post(':id/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a photo to a property (URL from upload)' })
  addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() body: { url: string; altText?: string; isCover?: boolean },
  ) {
    return this.propertiesService.addPhoto(id, ownerId, body);
  }

  @Delete('photos/:photoId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a property photo' })
  removePhoto(
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.propertiesService.removePhoto(photoId, ownerId);
  }
}

// ─── Public endpoint (no auth) ───────────────────────────────────────────────

@ApiTags('public')
@Controller('public/properties')
@UseGuards(JwtAuthGuard)
export class PublicPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all published properties (for sitemap / SEO)' })
  findAll() {
    return this.propertiesService.findAllPublished();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get published property by slug (public booking page)' })
  findBySlug(@Param('slug') slug: string) {
    return this.propertiesService.findBySlug(slug);
  }

  @Public()
  @Post(':propertyId/reviews')
  @ApiOperation({ summary: 'Submit a guest review for a property' })
  submitReview(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.propertiesService.submitReview(propertyId, dto);
  }
}
