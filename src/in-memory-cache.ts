import { KeyValueCache, KeyValueCacheSetOptions } from 'apollo-server-caching'

export default class InMemoryCache implements KeyValueCache {
  private cache: Map<string, {value: unknown; ttl: number;}> = new Map()

  /**
    * Get the value for a key, or null if not found.
    */
  public async get<T = unknown>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key)
    if (entry) {
      if (entry.ttl > Date.now()) {
        return entry.value as T
      }
      this.cache.delete(key)
    }
    return undefined
  }

  /**
    * Set the value for a key.
    * @param key The key to set.
    * @param value The value to set.
    * @param ttl The time to live(seconds) for the key.
    */
  public async set(key: string, value: unknown, options?: KeyValueCacheSetOptions): Promise<void> {
    if (!options || !options.ttl) return
    this.cache.set(key, {value, ttl: Date.now() + (options.ttl * 1000)})
  }

  /**
    * Clear the specified key.
    */
  public async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }
}
