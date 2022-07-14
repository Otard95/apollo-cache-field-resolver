import casual from 'casual';
import {CacheHint, CacheScope} from 'apollo-server-types'
import {
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLScalarType,
  ObjectTypeDefinitionNode,
  Kind,
  DirectiveNode,
  ArgumentNode,
  ValueNode,
  GraphQLResolveInfo,
  GraphQLSchema,
  OperationDefinitionNode,
  GraphQLOutputType,
} from 'graphql'
import { Node } from '../src/types'

export const createGraphQLFieldConfig = (): GraphQLFieldConfig<any, any> => ({
  type: createGraphQLScalarType()
})

export const createGraphQLFieldConfigMap = (): GraphQLFieldConfigMap<any, any> => ({
  foo: createGraphQLFieldConfig()
})

type ArgDef = {
  name: string,
  value: ValueNode
}
export const createArgumentNode = (arg?: ArgDef): ArgumentNode => ({
  kind: Kind.ARGUMENT,
  name: {
    kind: Kind.NAME,
    value: arg?.name ?? 'fields',
  },
  value: arg?.value ?? {
    kind: Kind.STRING,
    value: 'id',
  },
})

type DirectiveDef = {
  name: string
  arguments: ArgDef[]
}
export const createDirectiveNode = (dir?: DirectiveDef): DirectiveNode => ({
  kind: Kind.DIRECTIVE,
  name: {
    kind: Kind.NAME,
    value: dir?.name || 'key'
  },
  arguments: (dir?.arguments ?? [undefined]).map(createArgumentNode),
})

export const createObjectTypeDefinitionNode = (directives?: DirectiveDef[]): ObjectTypeDefinitionNode => ({
  kind: Kind.OBJECT_TYPE_DEFINITION,
  name: {
    kind: Kind.NAME,
    value: 'Some_test_object',
  },
  directives: (directives || [undefined]).map(createDirectiveNode),
})

export const createKeyDirective = (fieldValue: string): DirectiveDef => ({
  name: 'key',
  arguments: [{
    name: 'fields',
    value: {
      kind: Kind.STRING,
      value: fieldValue,
    },
  }]
})

interface InfoInit {
  returnType: GraphQLOutputType
  parentType: GraphQLObjectType
  fieldName?: string
}
export const createGraphQLResolveInfo = ({
  returnType,
  parentType,
  fieldName,
}: InfoInit): GraphQLResolveInfo => ({
  fieldName: fieldName ?? casual.word,
  fieldNodes: [],
  returnType,
  parentType,
  path: {
    prev: undefined,
    key: casual.word,
    typename: `__${casual.word}`,
  },
  schema: {} as GraphQLSchema,
  fragments: {},
  rootValue: null,
  operation: {} as OperationDefinitionNode,
  variableValues: {},
  cacheControl: {
    setCacheHint: () => {},
    cacheHintFromType: () => ({}),
    cacheHint: {
      maxAge: 10,
      replace: () => {},
      restrict: () => {},
      policyIfCacheable: (): Required<CacheHint> => ({
        maxAge: 10,
        scope: CacheScope.Public,
      }),
    },
  },
})

export const createGraphQLScalarType = (): GraphQLScalarType =>
  new GraphQLScalarType({
    name: `${casual.word}__scalar`,
  })

export const createGraphQLObjectType = (astNode?: ObjectTypeDefinitionNode) => new GraphQLObjectType({
  name: `${casual.word}__object`,
  description: 'This is a test of the GraphQLObjectType',
  fields: createGraphQLFieldConfigMap(),
  astNode,
})

export const createGraphQLNonNull = <OF extends GraphQLNullableType>(
  of: OF
): GraphQLNonNull<OF> => (new GraphQLNonNull(of)) as GraphQLNonNull<OF>

export const createNode = (nonNull: boolean = true): Node =>
  nonNull
    ? createGraphQLNonNull(
        createGraphQLObjectType(
          createObjectTypeDefinitionNode()
        )
      )
        : createGraphQLObjectType(
        createObjectTypeDefinitionNode()
      )
