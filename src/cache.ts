import { Redis } from "ioredis";
import { ValueOrPromise } from 'apollo-server-types';

export interface KeyValueCache {
  get<T = unknown>(key: string): ValueOrPromise<T | null>;
  set(key: string, value: unknown, ttl: number): ValueOrPromise<void>;
  delete(key: string): ValueOrPromise<void>;
}

export class InMemoryCache implements KeyValueCache {
  private cache: Map<string, {value: unknown; ttl: number}> = new Map();

  /**
    * Get the value for a key, or null if not found.
    */
  public get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      if (entry.ttl > Date.now()) {
        return entry.value as T;
      }
      this.cache.delete(key);
    }
    return null;
  }

  /**
    * Set the value for a key.
    * @param key The key to set.
    * @param value The value to set.
    * @param ttl The time to live(seconds) for the key.
    */
  public set(key: string, value: unknown, ttl: number): void {
    this.cache.set(key, { value, ttl: Date.now() + ttl });
  }

  /**
    * Clear the specified key.
    */
  public delete(key: string): void {
    this.cache.delete(key);
  }
}

type RedisKeyValueCacheOptions = {
  ttl?: number;
  client: Redis;
};
export class RedisKeyValueCache implements KeyValueCache {
  private readonly ttl: number;
  private readonly client: Redis;

  /**
    * Instantiate a new RedisKeyValueCache.
    */
  constructor(readonly options: RedisKeyValueCacheOptions) {
    this.ttl = options.ttl || Infinity;
    this.client = options.client;
  }

  /**
    * Get the value for a key, or null if not found.
    */
  public async get<T = unknown>(key: string): Promise<T | null> {
    const res = await this.client.get(key);
    if (!res) {
      return null;
    }
    return JSON.parse(res);
  }

  /**
    * Set the value for a key.
    * @param key The key to set.
    * @param value The value to set.
    * @param ttl The time to live(seconds) for the key.
    */
  public async set(key: string, value: unknown, ttl: number): Promise<void> {
    await this.client.set(
      key,
      JSON.stringify(value),
      'EX',
      ttl
    );
  }

  /**
    * Clear the specified key.
    */
  public async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

