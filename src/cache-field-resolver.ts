import {
  GraphQLFieldResolver,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  Kind
} from 'graphql'
import { InMemoryCache } from './cache'
import {
  CacheOptions,
  CacheKeyGenerator,
  CacheKeyType,
  Node
} from './types'

const isNode = (type: GraphQLOutputType): type is Node => {
  let retType = type instanceof GraphQLNonNull ? type.ofType : type
  if (
    retType instanceof GraphQLObjectType
    && retType.astNode.directives?.some(dir => dir.name.value === 'key')
  ) return true
  return false
}
const getNodeObject = (node: Node): GraphQLObjectType => {
  if (node instanceof GraphQLNonNull) return node.ofType
  return node
}
const getKeyFields = (type: GraphQLObjectType): string | null => {
  const keyFields = type.astNode.directives
    .find(dir => dir.name.value === 'key')?.arguments
    .find(arg => arg.name.value === 'fields')?.value
  if (!getKeyFields || keyFields.kind !== Kind.STRING) return null
  return keyFields.value
}
const resolveIdForNode = <
  P extends Record<string, unknown>,
  A extends Record<string, unknown>
>(
  returnType: Node,
  fieldName: string,
  parent: P,
  args: A
): string | null => {
  const keyFields = getKeyFields(getNodeObject(returnType))
  if (keyFields === null) return null
  if (fieldName === '__resolveReference') {
    if (keyFields in parent && typeof parent[keyFields] === 'string')
      return parent[keyFields] as string
  } else {
    if (keyFields in args && typeof args[keyFields] === 'string')
      return args[keyFields] as string
  }
  return null
}

const resolveCacheKeyType = (info: GraphQLResolveInfo): CacheKeyType => {
  const { returnType } = info
  if (isNode(returnType)) return 'node-id'
  return 'parent-field'
}

const resolveId = <
  P extends Record<string, unknown>,
  A extends Record<string, unknown>
>(
  keyType: CacheKeyType,
  info: GraphQLResolveInfo,
  parent: P,
  args: A
): string | null => {
  const { returnType, fieldName, parentType } = info
  if (keyType === 'node-id' && isNode(returnType)) {
    return resolveIdForNode(returnType, fieldName, parent, args)
  }
  if (keyType === 'parent-field' && isNode(parentType)) {
    const keyFields = getKeyFields(parentType)
    if (keyFields === null) return null
    if (keyFields in parent && typeof parent[keyFields] === 'string')
      return args[keyFields] as string
  }

  return null
}

const resolveCacheKey: CacheKeyGenerator<{}, {}> = (
  options: CacheOptions<{}, {}>,
  info,
  parent,
  args
): (string | null) => {
  const cacheKeyType = options.cacheKeyType || resolveCacheKeyType(info)
  const nodeId = typeof options.nodeId === 'function'
    ? options.nodeId(parent, args)
    : resolveId(cacheKeyType, info, parent, args)

  if (nodeId === null) return null

  if (cacheKeyType === 'node-id') {

    const { returnType } = info
    const node = getNodeObject(getNodeObject(returnType as Node))
    return `${node.name}.${nodeId}`

  } else {

    const {parentType} = info
    const node = getNodeObject(parentType)
    return `${node.name}{${nodeId}}.${info.fieldName}(${JSON.stringify(
      args
    )})`

  }
}


const defaultOptions: CacheOptions<{}, {}> = {
  cacheKey: resolveCacheKey,
  cache: new InMemoryCache()
}

const cacheFieldResolver = <
  P extends Record<string, unknown>,
  C extends Record<string | number | symbol, unknown>,
  A extends Record<string, unknown>,
  R
>(
  ...cacheFieldArgs: [CacheOptions<P, A>, GraphQLFieldResolver<P, C, A, R>]
    | [GraphQLFieldResolver<P, C, A, R>]
): GraphQLFieldResolver<P, C, A, R> => (parent, args, context, info) => {
  let options: CacheOptions<P, A> = defaultOptions
  let resolver: GraphQLFieldResolver<P, C, A, R>
  if (cacheFieldArgs.length === 1) {
    resolver = cacheFieldArgs[0]
  } else {
    options = cacheFieldArgs[0]
    resolver = cacheFieldArgs[1]
  }

  const cacheKey = options?.cacheKey(options, info, parent, args)
  console.log(cacheKey)

  return resolver(parent, args, context, info)
}

export default cacheFieldResolver
