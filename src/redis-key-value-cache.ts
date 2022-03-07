import { Redis } from "ioredis";
import { KeyValueCache } from "./types";

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

