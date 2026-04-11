import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

import { IcalService } from './ical.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class AddImportUrlDto {
  @IsString()
  @IsUrl()
  url: string;
}

// ─── Public export feed ───────────────────────────────────────────────────────

@ApiTags('ical')
@Controller('ical')
@UseGuards(JwtAuthGuard)
export class IcalController {
  constructor(private readonly icalService: IcalService) {}

  /**
   * Public .ics export — no auth required.
   * URL: GET /ical/export/:token
   */
  @Get('export/:token')
  @Public()
  @ApiOperation({ summary: 'Download .ics calendar feed for a room (public)' })
  async exportFeed(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const ics = await this.icalService.exportByToken(token);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.send(ics);
  }

  // ─── Authenticated room management ────────────────────────────────────────

  /**
   * GET /ical/rooms/:roomId — get export token + import URLs
   */
  @Get('rooms/:roomId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get iCal config for a room' })
  getConfig(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.icalService.getImportUrls(roomId, ownerId);
  }

  /**
   * POST /ical/rooms/:roomId/export-token — get or create export token
   */
  @Post('rooms/:roomId/export-token')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get or create an iCal export token for a room' })
  async getOrCreateToken(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    const token = await this.icalService.getOrCreateExportToken(roomId, ownerId);
    return { token };
  }

  /**
   * POST /ical/rooms/:roomId/import-urls — add an import URL
   */
  @Post('rooms/:roomId/import-urls')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an iCal import URL to a room' })
  addImportUrl(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: AddImportUrlDto,
  ) {
    return this.icalService.addImportUrl(roomId, ownerId, dto.url);
  }

  /**
   * DELETE /ical/rooms/:roomId/import-urls — remove an import URL
   */
  @Delete('rooms/:roomId/import-urls')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an iCal import URL from a room' })
  removeImportUrl(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: AddImportUrlDto,
  ) {
    return this.icalService.removeImportUrl(roomId, ownerId, dto.url);
  }

  /**
   * POST /ical/rooms/:roomId/sync — trigger manual sync
   */
  @Post('rooms/:roomId/sync')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger iCal sync for a room' })
  syncRoom(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    // validate ownership first via getImportUrls, then sync
    return this.icalService.getImportUrls(roomId, ownerId).then(() =>
      this.icalService.syncRoom(roomId),
    );
  }
}
