import InMemoryCache from './in-memory-cache'
import { resolveCacheKey } from './cache-key'
import { CacheOptions } from './types'
import { NonUndefined } from 'utility-types'

export const defaultOptions: CacheOptions = {
  cacheKey: resolveCacheKey,
  cache: new InMemoryCache(),
  cacheNull: false,
  logger: console,
}

/**
 * Set the the specified options default value.
 * Overrides if the specified options is already set.
 */
export const setDefaultOption = (
  option: keyof CacheOptions,
  value: NonUndefined<CacheOptions<any, any, any>[typeof option]>
) => {
  (defaultOptions as any)[option] = value
}

/**
 * Appends the specified options default value.
 * Does nothing if the specified options is already set.
 */
export const appendDefaultOption = (
  option: keyof CacheOptions,
  value: NonUndefined<CacheOptions<any, any, any>[typeof option]>
) => {
  if (option in defaultOptions) return;
  (defaultOptions as any)[option] = value
}

/**
 * Clear the specified options default value.
 * Does nothing if the specified options is not set.
 */
export const clearDefaultOption = (
  option: keyof CacheOptions,
) => {
  if (!(option in defaultOptions)) return;
  delete (defaultOptions as any)[option]
}
