import { Required } from 'utility-types'
import { CacheOptions, GQLResolver } from './types'
import generateSessionId from './session'
import { defaultOptions } from './options'

function fieldCacheResolver<
  Result,
  Parent extends {} = {},
  Context extends {} = {},
  Args extends {} = {},
>(
  resolver: GQLResolver<Parent, Context, Args, Result>
): GQLResolver<Parent, Context, Args, Result>;
function fieldCacheResolver<
  Result,
  Parent extends {} = {},
  Context extends {} = {},
  Args extends {} = {},
>(
  opts: CacheOptions<Parent, Context, Args>,
  resolver: GQLResolver<Parent, Context, Args, Result>
): GQLResolver<Parent, Context, Args, Result>;

function fieldCacheResolver<
  Result,
  Parent extends {} = {},
  Context extends {} = {},
  Args extends {} = {},
>(
  optsOrResolver: CacheOptions<Parent, Context, Args> | GQLResolver<Parent, Context, Args, Result>,
  resolver?: GQLResolver<Parent, Context, Args, Result>
): GQLResolver<Parent, Context, Args, Result> {
  let opts: CacheOptions<Parent, Context, Args> | null = null
  let resolverFn: GQLResolver<Parent, Context, Args, Result>

  if (resolver === undefined) {
    resolverFn = optsOrResolver as GQLResolver<Parent, Context, Args, Result>
  } else {
    opts = optsOrResolver as CacheOptions<Parent, Context, Args>
    resolverFn = resolver as GQLResolver<Parent, Context, Args, Result>
  }

  const cacheResolver: GQLResolver<Parent, Context, Args, Result> = async (parent, args, context, info) => {

    const options = { ...defaultOptions, ...(opts || {}) } as
      CacheOptions<Parent, Context, Args>
      & Pick<
        Required<CacheOptions<Parent, Context, Args>>,
        'cacheKey' | 'cache' | 'logger'
      >

    const cache = typeof options.cache === 'function'
      ? options.cache(context)
      : options.cache
    const cacheHint = options.cacheHint
      ? options.cacheHint(context, info)
      : info.cacheControl.cacheHint
    const sessionId = generateSessionId(options.sessionId, context, cacheHint)

    if (sessionId === null) {
      options.logger.warn('[fieldCacheResolver](SKIP) a session id is required for non-public cache')
      return resolverFn(parent, args, context, info)
    }

    const cacheKey =
      options.cacheKey(options, sessionId, info, parent, args, context)

    if (cacheKey === null || cacheKey.length <= 0) {
      options.logger.warn('[fieldCacheResolver](SKIP) could not create cache key')
      return resolverFn(parent, args, context, info)
    }

    try {
      let cachedValue = await cache.get(cacheKey)
      if (cachedValue !== undefined) {
        const parsedValue = JSON.parse(cachedValue)
        if (parsedValue !== undefined && (options.cacheNull || parsedValue !== null)) {
          options.logger.debug(`[fieldCacheResolver] cache hit on key ${cacheKey}`)
          return parsedValue
        }
      }
      options.logger.debug(`[fieldCacheResolver] cache miss on key ${cacheKey}`)
    } catch (e) {
      options.logger.debug(`[fieldCacheResolver] cache value parse error ${cacheKey}`)
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
      options.logger.debug(`[fieldCacheResolver] cached value on key ${cacheKey}`)
      await cache.set(cacheKey, JSON.stringify(res), { ttl: maxAge })
    }

    return res

  }

  return cacheResolver

}

export default fieldCacheResolver
