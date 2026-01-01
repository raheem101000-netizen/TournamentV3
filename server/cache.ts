type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Array.from(this.cache.entries()).forEach(([key, entry]) => {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      });
    }, 60000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    Array.from(this.cache.keys()).forEach((key) => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new MemoryCache();

export const CACHE_KEYS = {
  SERVERS_LIST: 'servers:list',
  SERVER: (id: string) => `server:${id}`,
  TOURNAMENTS_PUBLIC: 'tournaments:public',
  TOURNAMENT: (id: string) => `tournament:${id}`,
  USER: (id: string) => `user:${id}`,
} as const;

export const CACHE_TTL = {
  SHORT: 30,
  MEDIUM: 60,
  LONG: 300,
  VERY_LONG: 600,
} as const;
