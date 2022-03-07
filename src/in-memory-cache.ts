import { KeyValueCache } from "./types";

export default class InMemoryCache implements KeyValueCache {
  private cache: Map<string, {value: unknown; ttl: number;}> = new Map();

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
    this.cache.set(key, {value, ttl: Date.now() + (ttl * 1000)});
  }

  /**
    * Clear the specified key.
    */
  public delete(key: string): void {
    this.cache.delete(key);
  }
}
