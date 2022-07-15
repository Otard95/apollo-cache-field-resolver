import { Required } from 'utility-types'
import InMemoryCache from "./in-memory-cache"
import { resolveCacheKey } from './cache-key'
import { CacheOptions, GQLResolver } from './types'

const defaultOptions = {
  cacheKey: resolveCacheKey,
  cache: new InMemoryCache(),
  cacheNull: false,
}

function cacheFieldResolver<
  P extends { [argName: string]: unknown },
  C,
  A extends { [argName: string]: unknown },
  R
>(
  resolver: GQLResolver<P, C, A, R>
): GQLResolver<P, C, A, R>;
function cacheFieldResolver<
  P extends { [argName: string]: unknown },
  C,
  A extends { [argName: string]: unknown },
  R
>(
  opts: CacheOptions<P, C, A>,
  resolver: GQLResolver<P, C, A, R>
): GQLResolver<P, C, A, R>;

function cacheFieldResolver<
  P extends { [argName: string]: unknown },
  C,
  A extends { [argName: string]: unknown },
  R
>(
  optsOrResolver: CacheOptions<P, C, A> | GQLResolver<P, C, A, R>,
  resolver?: GQLResolver<P, C, A, R>
): GQLResolver<P, C, A, R> {
  let opts: CacheOptions<P, C, A> | null = null
  let resolverFn: GQLResolver<P, C, A, R>

  if (resolver === undefined) {
    resolverFn = optsOrResolver as GQLResolver<P, C, A, R>
  } else {
    opts = optsOrResolver as CacheOptions<P, C, A>
    resolverFn = resolver as GQLResolver<P, C, A, R>
  }

  const options = { ...defaultOptions, ...(opts || {}) } as
    CacheOptions<P, C, A>
    & Pick<
      Required<CacheOptions<P, C, A>>,
      'cacheKey' | 'cache'
    >

  const cacheResolver: GQLResolver<P, C, A, R> = async (parent, args, context, info) => {
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
      options.cacheKey(options, sessionId, info, parent, args)

    if (cacheKey === null || cacheKey.length <= 0) {
      (options.logger || console).warn('[cacheFieldResolver](SKIP) could not create cache key')
      return resolverFn(parent, args, context, info)
    }

    try {
      let cachedValue = await cache.get(cacheKey)
      if (cachedValue !== undefined) {
        const parsedValue = JSON.parse(cachedValue)
        if (parsedValue !== undefined && parsedValue !== null) {
          (options.logger || console).debug(`[cacheFieldResolver] cache hit on key ${cacheKey}`)
          return parsedValue
        }
      }
    } catch (e) {}
    finally {
      (options.logger || console).debug(`[cacheFieldResolver] cache miss on key ${cacheKey}`)
    }

    const res = await resolverFn(parent, args, context, info)

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
      (options.logger || console).debug(`[cacheFieldResolver] cached value on key ${cacheKey}`)
      await cache.set(cacheKey, JSON.stringify(res), { ttl: maxAge })
    }

    return res
  }

  return cacheResolver
}

export default cacheFieldResolver
