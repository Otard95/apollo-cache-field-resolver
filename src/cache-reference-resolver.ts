import fieldCacheResolver from "./cache-field-resolver";
import { CacheOptions, ReferenceResolver } from "./types";

function referenceCacheResolver<
  Result,
  Reference extends {} = {},
  Context extends {} = {},
>(
  resolver: ReferenceResolver<Result, Reference, Context>
): ReferenceResolver<Result, Reference, Context>;
function referenceCacheResolver<
  Result,
  Reference extends {} = {},
  Context extends {} = {},
>(
  opts: CacheOptions<Reference, Context>,
  resolver: ReferenceResolver<Result, Reference, Context>
): ReferenceResolver<Result, Reference, Context>;

function referenceCacheResolver<
  Result,
  Reference extends {} = {},
  Context extends {} = {},
>(
  optsOrResolver: CacheOptions<Reference, Context, {}> | ReferenceResolver<Result, Reference, Context>,
  resolver?: ReferenceResolver<Result, Reference, Context>
): ReferenceResolver<Result, Reference, Context> {
  let opts: CacheOptions<Reference, Context, {}> | null = null
  let resolverFn: ReferenceResolver<Result, Reference, Context>

  if (resolver === undefined) {
    resolverFn = optsOrResolver as ReferenceResolver<Result, Reference, Context>
  } else {
    opts = optsOrResolver as CacheOptions<Reference, Context, {}>
    resolverFn = resolver as ReferenceResolver<Result, Reference, Context> 
  }

  return async (reference, context, info) => {
    return fieldCacheResolver(opts || {}, async (parent, _args, context, info) => {
      return resolverFn(parent, context, info)
    })(reference, {}, context, info)
  }
}

export default referenceCacheResolver
