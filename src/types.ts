import { GraphQLObjectType, GraphQLNonNull, GraphQLResolveInfo } from 'graphql'
import { CacheHint } from 'apollo-server-types'
import { KeyValueCache } from './cache'

export type CacheKeyType = 'node-id' | 'parent-field'
export type Node = GraphQLObjectType | GraphQLNonNull<GraphQLObjectType>
// We define this because the `TResult` type arg was not introduced until
// `graphql@16`(https://github.com/graphql/graphql-js/commit/e88c58efc3cc56ec2353ef3153bd1f2302fdd629)
export type GQLResolver<
  TSource,
  TContext,
  TArgs = { [argName: string]: any },
  TResult = unknown
> = (
  source: TSource,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult


export type CacheKeyGenerator<
    P extends Record<string, unknown>,
    C extends Record<string, unknown>,
    A extends Record<string, unknown>
> = (
  option: CacheOptions<P, C, A>,
  info: GraphQLResolveInfo,
  parent: P,
  args: A
) => (string | null)

export interface CacheOptions<
    P extends Record<string, unknown>,
    C extends Record<string, unknown>,
    A extends Record<string, unknown>
    > {
  nodeId?: (parent: P, args: A) => string | null
  cacheKeyType?: CacheKeyType
  cacheKey?: CacheKeyGenerator<P, C, A>
  cacheHint?: (
    context: Record<string | number | symbol, unknown>,
    info: GraphQLResolveInfo
  ) => CacheHint
  sessionId?: string | ((context: C) => string)
  cache?: KeyValueCache | ((context: C) => KeyValueCache)
}
