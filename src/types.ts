import { GraphQLObjectType, GraphQLNonNull, GraphQLResolveInfo } from 'graphql'
import { CacheHint } from 'apollo-server-types'
import { KeyValueCache } from './cache'

export type CacheKeyType = 'node-id' | 'parent-field'
export type Node = GraphQLObjectType | GraphQLNonNull<GraphQLObjectType>

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
