import { GraphQLObjectType, GraphQLNonNull, GraphQLResolveInfo } from 'graphql'
import { CacheHint, Logger } from 'apollo-server-types'
import { KeyValueCache } from 'apollo-server-caching'

export type CacheKeyType = 'node-id' | 'parent-field'
export type Node = GraphQLObjectType | GraphQLNonNull<GraphQLObjectType>
// We define this because the `TResult` type arg was not introduced until
// `graphql@16`(https://github.com/graphql/graphql-js/commit/e88c58efc3cc56ec2353ef3153bd1f2302fdd629)
export type GQLResolver<
  TSource,
  TContext,
  TArgs,
  TResult,
> = (
  source: TSource,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export type CacheKeyGenerator<
    P extends {} = {},
    C extends {} = {},
    A extends {} = {},
> = (
  option: CacheOptions<P, C, A>,
  sessionId: string | null,
  info: GraphQLResolveInfo,
  parent: P,
  args: A,
  context: C
) => (string | null)

export interface CacheOptions<
  P extends {} = {},
  C extends {} = {},
  A extends {} = {},
> {
  cacheNull?: boolean
  nodeId?: (parent: P, args: A, context: C) => string | null
  cacheKeyType?: CacheKeyType
  cacheKey?: CacheKeyGenerator<P, C, A>
  cacheHint?: (
    context: C,
    info: GraphQLResolveInfo
  ) => CacheHint
  sessionId?: string | ((context: C) => string)
  cache?: KeyValueCache | ((context: C) => KeyValueCache)
  logger?: Logger
}
