import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  Kind
} from 'graphql'
import { GraphQLNullableType } from 'graphql/type/definition'
import {
  CacheKeyGenerator,
  CacheKeyType,
  Node
} from './types'

export const isObjectType = (type: GraphQLOutputType): type is GraphQLObjectType =>
  type.constructor.name === 'GraphQLObjectType'
export const isNonNullType = (type: GraphQLOutputType): type is GraphQLNonNull<GraphQLNullableType> =>
  type.constructor.name === 'GraphQLNonNull'

export const isNode = (type: GraphQLOutputType): type is Node => {
  let nullableType = isNonNullType(type) ? type.ofType : type
  if (isObjectType(nullableType)
    && nullableType.astNode?.directives?.some(dir => dir.name.value === 'key'))
    return true
  return false
}

export const getNullableType = <T extends GraphQLOutputType>(
  nonNullType: GraphQLNonNull<T> | T
): T => {
  if (isNonNullType(nonNullType))
    return nonNullType.ofType as T
  return nonNullType
}

export const getKeyFields = (type: GraphQLObjectType): string | null => {
  const keyFields = type.astNode?.directives
    ?.find(dir => dir.name.value === 'key')?.arguments
    ?.find(arg => arg.name.value === 'fields')?.value
  if (!keyFields || keyFields.kind !== Kind.STRING)
    return null
  return keyFields.value
}

export const resolveCacheKeyType = (info: GraphQLResolveInfo): CacheKeyType => {
  const {returnType} = info
  if (isNode(returnType))
    return 'node-id'
  return 'parent-field'
}

export const resolveIdForNode = <
  P extends Record<string, unknown>,
  A extends Record<string, unknown>
>(
  returnType: Node,
  fieldName: string,
  parent: P,
  args: A
): string | null => {
  const keyFields = getKeyFields(getNullableType(returnType))
  if (keyFields === null)
    return null
  if (fieldName === '__resolveReference') {
    if (keyFields in parent && typeof parent[keyFields] === 'string')
      return parent[keyFields] as string
  } else {
    if (keyFields in args && typeof args[keyFields] === 'string')
      return args[keyFields] as string
  }
  return null
}

export const resolveId = <
  P extends Record<string, unknown>,
  A extends Record<string, unknown>
>(
  keyType: CacheKeyType,
  info: GraphQLResolveInfo,
  parent: P,
  args: A
): string | null => {
  const {returnType, fieldName, parentType} = info
  if (keyType === 'node-id' && isNode(returnType)) {
    return resolveIdForNode(returnType, fieldName, parent, args)
  }
  if (keyType === 'parent-field' && isNode(parentType)) {
    const keyFields = getKeyFields(parentType)
    if (keyFields === null)
      return null
    if (keyFields in parent && typeof parent[keyFields] === 'string')
      return parent[keyFields] as string
  }

  return null
}

export const resolveCacheKey: CacheKeyGenerator = (
  options,
  sessionId,
  info,
  parent,
  args,
  context
): (string | null) => {
  const cacheKeyType = options.cacheKeyType || resolveCacheKeyType(info)
  const nodeId = typeof options.nodeId === 'function'
    ? options.nodeId(parent, args, context)
    : resolveId(cacheKeyType, info, parent, args)

  if (nodeId === null) {
    options.logger?.warn('[fieldCacheResolver](cacheKey) Could not resolve node id')
    return null
  }

  if (cacheKeyType === 'node-id') {
    const { returnType } = info
    const node = getNullableType(returnType)
    if (isNode(node))
      return `${sessionId ? `<${sessionId}>` : ''}${node.name}.${nodeId}`

    options.logger?.warn('[fieldCacheResolver](cacheKey) Return type is not a node')
  } else {
    const { parentType } = info
    if (isNode(parentType))
      return `${sessionId
        ? `<${sessionId}>`
        : ''
        }${parentType.name}{${nodeId}}.${info.fieldName}(${JSON.stringify(
          args
        )})`

    options.logger?.warn('[fieldCacheResolver](cacheKey) Parent type is not a node')
  }

  return null
}
