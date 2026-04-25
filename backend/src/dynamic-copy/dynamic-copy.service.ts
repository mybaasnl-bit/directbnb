import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DynamicCopy } from '@prisma/client';

/** In-memory cache TTL: 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class DynamicCopyService {
  private readonly logger = new Logger(DynamicCopyService.name);

  /** Simple in-memory cache — one slot for the entire table */
  private cache: { entries: DynamicCopy[]; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  // ─── Cache helpers ────────────────────────────────────────────────────────────

  private invalidateCache(): void {
    this.cache = null;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────────

  /**
   * Returns all entries — served from cache when warm.
   * At most one DB round-trip per CACHE_TTL_MS window.
   */
  async findAll(): Promise<DynamicCopy[]> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.entries;
    }

    this.logger.debug('Cache miss — fetching dynamic_copy from DB');
    const entries = await this.prisma.dynamicCopy.findMany({
      orderBy: { key: 'asc' },
    });

    this.cache = { entries, expiresAt: Date.now() + CACHE_TTL_MS };
    return entries;
  }

  /**
   * Returns a flat { key → value } map for the public API.
   * Reading a key in a component is then a synchronous Map.get() — zero I/O.
   */
  async findAllAsMap(): Promise<Record<string, string>> {
    const entries = await this.findAll();
    return Object.fromEntries(entries.map((e) => [e.key, e.value]));
  }

  // ─── Write ────────────────────────────────────────────────────────────────────

  /** Create or update a copy entry by key. Invalidates cache on write. */
  async upsert(key: string, value: string, description?: string): Promise<DynamicCopy> {
    const entry = await this.prisma.dynamicCopy.upsert({
      where: { key },
      create: { key, value, description },
      update: { value, ...(description !== undefined ? { description } : {}) },
    });
    this.invalidateCache();
    this.logger.log(`Upserted copy key "${key}"`);
    return entry;
  }

  /** Delete a copy entry by key. Throws 404 if not found. */
  async delete(key: string): Promise<void> {
    const existing = await this.prisma.dynamicCopy.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException(`Copy key "${key}" not found`);

    await this.prisma.dynamicCopy.delete({ where: { key } });
    this.invalidateCache();
    this.logger.log(`Deleted copy key "${key}"`);
  }

  /**
   * Sync default copy entries — inserts only keys that don't yet exist in the DB.
   * Existing keys are never overwritten (admin customisations are preserved).
   * Returns the count of newly inserted entries.
   */
  async syncDefaults(
    entries: { key: string; value: string; description?: string }[],
  ): Promise<{ inserted: number; skipped: number; total: number }> {
    const result = await this.prisma.dynamicCopy.createMany({
      data: entries.map((e) => ({
        key: e.key,
        value: e.value,
        description: e.description ?? null,
      })),
      skipDuplicates: true,   // existing keys (admin-customised) are left untouched
    });

    this.invalidateCache();
    this.logger.log(
      `syncDefaults: inserted ${result.count} of ${entries.length} entries (${entries.length - result.count} already existed)`,
    );

    return {
      inserted: result.count,
      skipped: entries.length - result.count,
      total: entries.length,
    };
  }
}
