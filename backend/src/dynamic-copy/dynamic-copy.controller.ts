import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/guards/jwt-auth.guard';
import { DynamicCopyService } from './dynamic-copy.service';

/**
 * Public endpoint — no auth required.
 * Returns all dynamic copy as a flat { key: value } map.
 * The frontend fetches this once per session (React Query staleTime: 5 min)
 * and serves useDynamicCopy() calls via synchronous Map.get() — zero I/O per call.
 */
@ApiTags('dynamic-copy')
@Controller('dynamic-copy')
export class DynamicCopyController {
  constructor(private readonly service: DynamicCopyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Fetch all dynamic copy as a key→value map (public, cached)' })
  getAll(): Promise<Record<string, string>> {
    return this.service.findAllAsMap();
  }
}
