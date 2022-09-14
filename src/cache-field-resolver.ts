import { Required } from 'utility-types'
import InMemoryCache from "./in-memory-cache"
import { resolveCacheKey } from './cache-key'
import { CacheOptions, GQLResolver } from './types'
import generateSessionId from './session'

const defaultOptions = {
  cacheKey: resolveCacheKey,
  cache: new InMemoryCache(),
  cacheNull: false,
  logger: console,
}

const cacheFieldResolver = <
  P extends { [argName: string]: unknown },
  C,
  A extends { [argName: string]: unknown },
  R
>(
  opts?: CacheOptions<P, C, A>,
) => (
  resolver: GQLResolver<P, C, A, R>
): GQLResolver< P, C, A, R> => {

  const options = { ...defaultOptions, ...(opts || {}) } as
    CacheOptions<P, C, A>
    & Pick<
      Required<CacheOptions<P, C, A>>,
      'cacheKey' | 'cache' | 'logger'
    >

  const cacheResolver: GQLResolver<P, C, A, R> = async (parent, args, context, info) => {

    const cache = typeof options.cache === 'function'
      ? options.cache(context)
      : options.cache
    const cacheHint = options.cacheHint
      ? options.cacheHint(context, info)
      : info.cacheControl.cacheHint
    const sessionId = generateSessionId(options.sessionId, context, cacheHint)

    const cacheKey =
      options.cacheKey(options, sessionId, info, parent, args)

    if (cacheKey === null || cacheKey.length <= 0) {
      options.logger.warn('[cacheFieldResolver](SKIP) could not create cache key')
      return resolver(parent, args, context, info)
    }

    try {
      let cachedValue = await cache.get(cacheKey)
      if (cachedValue !== undefined) {
        const parsedValue = JSON.parse(cachedValue)
        if (parsedValue !== undefined && (options.cacheNull || parsedValue !== null)) {
          options.logger.debug(`[cacheFieldResolver] cache hit on key ${cacheKey}`)
          return parsedValue
        }
      }
      options.logger.debug(`[cacheFieldResolver] cache miss on key ${cacheKey}`)
    } catch (e) {
      options.logger.debug(`[cacheFieldResolver] cache value parse error ${cacheKey}`)
    }

    const res = await resolver(parent, args, context, info)

    const maxAge = cacheHint && cacheHint.maxAge
    if (
      (
        options.cacheNull
        || (
          res !== null && res !== undefined
        )
      )
      && typeof maxAge === 'number' && maxAge > 0
    ) {
      options.logger.debug(`[cacheFieldResolver] cached value on key ${cacheKey}`)
      await cache.set(cacheKey, JSON.stringify(res), { ttl: maxAge })
    }

    return res

  }

  return cacheResolver

}

export default cacheFieldResolver
