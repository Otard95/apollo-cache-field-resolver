import { Required } from 'utility-types'
import { InMemoryCache } from './cache'
import { getKeyFields, resolveCacheKey } from './cache-key'
import { CacheOptions, GQLResolver } from './types'

const defaultOptions = {
  cacheKey: resolveCacheKey,
  cache: new InMemoryCache()
}

const cacheFieldResolver = <
  P extends Record<string, unknown>,
  C extends Record<string, unknown>,
  A extends Record<string, unknown>,
  R extends Promise<unknown>
>(
  ...cacheFieldArgs: [CacheOptions<P, C, A>, GQLResolver<P, C, A, R>]
                   | [GQLResolver<P, C, A, R>]
): GQLResolver<P, C, A, R> => {

  const cacheResolver = (async (parent, args, context, info) => {

    let opts: CacheOptions<P, C, A> | null = null
    let resolver: GQLResolver<P, C, A, R>
    if (cacheFieldArgs.length === 1) {
      resolver = cacheFieldArgs[0]
    } else {
      opts = cacheFieldArgs[0]
      resolver = cacheFieldArgs[1]
    }
    const options = { ...defaultOptions, ...opts } as
      CacheOptions<P, C, A>
      & Pick<
        Required<CacheOptions<P, C, A>>,
        'cacheKey' | 'cache'
      >

    const cache = typeof options.cache === 'function'
      ? options.cache(context)
      : options.cache
    const cacheHint = options.cacheHint
      ? options.cacheHint(context, info)
      : info.cacheControl.cacheHint
    const sessionId = options.sessionId
      ? typeof options.sessionId === 'function'
        ? options.sessionId(context)
        : options.sessionId
      : null

    const cacheKey =
      options.cacheKey(options, info, parent, args)

    if (cacheKey === null || cacheKey.length <= 0) {
      (options.logger || console).warn();
      return resolver(parent, args, context, info)
    }

    let cachedValue: unknown | null
    if (typeof sessionId === 'string' && sessionId.length > 0)
      cachedValue = await cache.get(`${cacheKey}.${sessionId}`)
    else
      cachedValue = await cache.get(cacheKey)
    if (cachedValue !== undefined && cachedValue !== null) return cachedValue

    const res = await resolver(parent, args, context, info)

    const maxAge = cacheHint && cacheHint.maxAge
    if (
      res !== null && res !== undefined
      && typeof maxAge === 'number' && maxAge > 0
    ) {
      if (typeof sessionId === 'string' && sessionId.length > 0)
        await cache.set(`${cacheKey}.${sessionId}`, res, maxAge)
      else
        await cache.set(cacheKey, res, maxAge)
    }

  }) as GQLResolver<P, C, A, R>

  return cacheResolver
}

export default cacheFieldResolver
