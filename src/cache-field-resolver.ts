import { GraphQLFieldResolver } from 'graphql'
import { Required } from 'utility-types'
import { InMemoryCache } from './cache'
import { resolveCacheKey } from './cache-key'
import { CacheOptions } from './types'

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
  ...cacheFieldArgs: [CacheOptions<P, C, A>, GraphQLFieldResolver<P, C, A, R>]
                   | [GraphQLFieldResolver<P, C, A, R>]
): GraphQLFieldResolver<P, C, A, R> => {

  const cacheResolver = (async (parent, args, context, info): Promise<unknown> => {

    let opts: CacheOptions<P, C, A> | null = null
    let resolver: GraphQLFieldResolver<P, C, A, R>
    if (cacheFieldArgs.length === 1) {
      resolver = cacheFieldArgs[0]
    } else {
      opts = cacheFieldArgs[0]
      resolver = cacheFieldArgs[1]
    }
    const options: CacheOptions<P, C, A> & Pick<
      Required<CacheOptions<P, C, A>>,
      'cacheKey' | 'cache'
    > = { ...defaultOptions, ...opts }

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

    if (cacheKey !== null) {
      let cachedValue: unknown | null
      if (typeof sessionId === 'string' && sessionId.length > 0)
        cachedValue = await cache.get(`${cacheKey}.${sessionId}`)
      else
        cachedValue = await cache.get(cacheKey)
      if (cachedValue !== undefined && cachedValue !== null) return cachedValue
    }

    const res = await resolver(parent, args, context, info)

    const maxAge = cacheHint && cacheHint.maxAge
    if (
      typeof cacheKey === 'string' && cacheKey.length > 0
      && res !== null && res !== undefined
      && typeof maxAge === 'number' && maxAge > 0
    ) {
      if (typeof sessionId === 'string' && sessionId.length > 0)
        await cache.set(`${cacheKey}.${sessionId}`, res, maxAge)
      else
        await cache.set(cacheKey, res, maxAge)
    }

  }) as GraphQLFieldResolver<P, C, A, R>

  return cacheResolver
}

export default cacheFieldResolver
