import Redis from "ioredis";
import { KeyValueCache, KeyValueCacheSetOptions } from 'apollo-server-caching'
// import { KeyValueCache } from "./types";

type RedisKeyValueCacheOptions = {
  client: Redis;
};
export default class RedisKeyValueCache implements KeyValueCache {
  private readonly client: Redis;

  /**
    * Instantiate a new RedisKeyValueCache.
    */
  constructor(readonly options: RedisKeyValueCacheOptions) {
    this.client = options.client;
  }

  /**
    * Get the value for a key, or null if not found.
    */
  public async get<T = unknown>(key: string): Promise<T | undefined> {
    const value = await this.client.get(key);
    if (!value) return;
    return JSON.parse(value);
  }

  /**
    * Set the value for a key.
    * @param key The key to set.
    * @param value The value to set.
    * @param ttlOrOptions The time to live(seconds) for the key.
    */
  public async set(key: string, value: unknown, ttlOrOptions?: number | KeyValueCacheSetOptions): Promise<void> {
    const timeToLive = typeof ttlOrOptions === 'number' ? ttlOrOptions : ttlOrOptions?.ttl;
    if (!timeToLive) return;
    await this.client.set(
      key,
      JSON.stringify(value),
      'EX',
      timeToLive,
    );
  }

  /**
    * Clear the specified key.
    */
  public async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
