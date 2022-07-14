import {
  isNonNullType,
  isObjectType,
  isNode,
  getNullableType,
  getKeyFields,
  resolveCacheKeyType,
  resolveIdForNode,
} from '../../src/cache-key';
import {
  createObjectTypeDefinitionNode,
  createGraphQLNonNull,
  createGraphQLObjectType,
  createGraphQLScalarType,
  createNode,
  createKeyDirective,
  createGraphQLResolveInfo,
} from '../helpers';

export default () => {
  describe('isObjectType', () => {
    it('should return true for GraphQLObjectType', () => {
      expect(
        isObjectType(createGraphQLObjectType())
      ).toEqual(true)
    });

    it('should return false for GraphQLNonNull', () => {
      expect(
        isObjectType(createGraphQLNonNull(createGraphQLScalarType()))
      ).toEqual(false)
    });

    it('should return false for GraphQLScalarType', () => {
      expect(
        isObjectType(createGraphQLScalarType())
      ).toEqual(false)
    });
  }) // END isObjectType tests

  describe('isNonNullType', () => {
    it('should return true for GraphQLNonNull', () => {
      expect(
        isNonNullType(createGraphQLNonNull(createGraphQLScalarType()))
      ).toEqual(true)
    });

    it('should return false for GraphQLObjectType', () => {
      expect(
        isNonNullType(createGraphQLObjectType())
      ).toEqual(false)
    });

    it('should return false for GraphQLScalarType', () => {
      expect(
        isNonNullType(createGraphQLScalarType())
      ).toEqual(false)
    });
  }) // END isNonNullType tests

  describe('isNode', () => {
    it('should return true for GraphQLNonNull<GraphQLObjectType> with @key directive', () => {
      expect(
        isNode(createNode())
      ).toEqual(true)
    });

    it('should return true for GraphQLObjectType with @key directive', () => {
      expect(
        isNode(createNode(false))
      ).toEqual(true)
    });

    it('should return false for GraphQLNonNull<GraphQLObjectType> without @key directive', () => {
      expect(
        isNode(createGraphQLNonNull(createGraphQLObjectType()))
      ).toEqual(false)
    });

    it('should return false for GraphQLNonNull of any other type', () => {
      expect(
        isNode(createGraphQLNonNull(createGraphQLScalarType()))
      ).toEqual(false)
    });

    it('should return false for GraphQLScalarType', () => {
      expect(
        isNode(createGraphQLScalarType())
      ).toEqual(false)
    });
  }) // END isNode tests

  describe('getNullableType', () => {
    it('should return GraphQLObjectType for GraphQLNonNull<GraphQLObjectType>', () => {
      const objType = createGraphQLObjectType();
      expect(
        getNullableType(createGraphQLNonNull(objType))
      ).toBe(objType)
    })

    it('should return GraphQLObjectType for GraphQLObjectType', () => {
      const objType = createGraphQLObjectType();
      expect(
        getNullableType(objType)
      ).toBe(objType)
    })

    it('should return GraphQLScalarType for GraphQLNonNull<GraphQLScalarType>', () => {
      const scalarType = createGraphQLScalarType();
      expect(
        getNullableType(createGraphQLNonNull(scalarType))
      ).toBe(scalarType)
    })

    it('should return GraphQLScalarType for GraphQLScalarType', () => {
      const scalarType = createGraphQLScalarType();
      expect(
        getNullableType(scalarType)
      ).toBe(scalarType)
    })
  }) // END getNullableType tests

  describe('getKeyFields', () => {
    it('should return null for GraphQLObjectType without @key directive', () => {
      expect(
        getKeyFields(createGraphQLObjectType())
      ).toEqual(null)
    })

    it('should return `id` for GraphQLObjectType with @key directive', () => {
      expect(
         getKeyFields(createGraphQLObjectType(createObjectTypeDefinitionNode()))
      ).toEqual('id')
    })

    it('should return `key` for GraphQLObjectType with @key directive where `fields` arg equals `key`', () => {
      expect(
        getKeyFields(
          createGraphQLObjectType(
            createObjectTypeDefinitionNode([createKeyDirective('key')])
          )
        )
      ).toEqual('key')
    })

    describe('When more than one @key directive is present', () => {
      console.log('TODO: Implement getKeyFields for when more than one @key directive is present')

      it('should return `key` for GraphQLObjectType with `@key(fields: "key") @key(fields: "id")`', () => {
        expect(
          getKeyFields(
            createGraphQLObjectType(
              createObjectTypeDefinitionNode([
                createKeyDirective('key'),
                createKeyDirective('id'),
              ])
            )
          )
        ).toEqual('key')
      })
    })
  }) // END getKeyFields tests

  describe('resolveCacheKeyType', () => {
    describe('When returnType is a `node`', () => {
      it('should return `node-id` when returnType is GraphQLObjectType with @key directive', () => {
        expect(
          resolveCacheKeyType(
            createGraphQLResolveInfo({
              returnType: createGraphQLObjectType(createObjectTypeDefinitionNode()),
              parentType: createGraphQLObjectType(),
            })
          )
        ).toEqual('node-id')
      })

      it('should return `node-id` when returnType is GraphQLNonNull<GraphQLObjectType> with @key directive', () => {
        expect(
          resolveCacheKeyType(
            createGraphQLResolveInfo({
              returnType: createGraphQLNonNull(createGraphQLObjectType(createObjectTypeDefinitionNode())),
              parentType: createGraphQLObjectType(),
            })
          )
        ).toEqual('node-id')
      })
    })

    describe('When returnType is NOT a `node`', () => {
      it('should return `parent-field` when returnType is GraphQLNonNull<GraphQLObjectType>', () => {
        expect(
          resolveCacheKeyType(
            createGraphQLResolveInfo({
              returnType: createGraphQLNonNull(createGraphQLObjectType()),
              parentType: createGraphQLObjectType(),
            })
          )
        ).toEqual('parent-field')
      })

      it('should return `parent-field` when returnType is GraphQLScalarType', () => {
        expect(
          resolveCacheKeyType(
            createGraphQLResolveInfo({
              returnType: createGraphQLObjectType(),
              parentType: createGraphQLObjectType(),
            })
          )
        ).toEqual('parent-field')
      })

      it('should return `parent-field` when returnType is GraphQLNonNull<GraphQLScalarType>', () => {
        expect(
          resolveCacheKeyType(
            createGraphQLResolveInfo({
              returnType: createGraphQLNonNull(createGraphQLScalarType()),
              parentType: createGraphQLObjectType(),
            })
          )
        ).toEqual('parent-field')
      })

      it('should return `parent-field` when returnType is GraphQLScalarType', () => {
        expect(
          resolveCacheKeyType(
            createGraphQLResolveInfo({
              returnType: createGraphQLScalarType(),
              parentType: createGraphQLObjectType(),
            })
          )
        ).toEqual('parent-field')
      })
    })
  }) // END resolveCacheKeyType tests

  describe('resolveIdForNode', () => {
    const parent = { id: '7395227d-811c-4da6-bfe5-3e5c2afb8c00' }
    const args = { id: '2572385b-313b-4bfe-b07e-f5fe3bb10cdb' }

    describe('When returnType is missing @key directive it should return null no matter the other variables are', () => {
      const returnType = createGraphQLObjectType()

      it('fieldName is `__resolveReference`', () => {
        expect(
          resolveIdForNode(returnType, '__resolveReference', {}, {})
        ).toEqual(null)
      })
      it('fieldName is `__resolveReference` and parent has `id` field', () => {
        expect(
          resolveIdForNode(returnType, '__resolveReference', parent, {})
        ).toEqual(null)
      })
      it('fieldName id NOT `__resolveReference`', () => {
        expect(
          resolveIdForNode(returnType, '__resolveReference', {}, {})
        ).toEqual(null)
      })
      it('fieldName id NOT `__resolveReference` and args has `id` field', () => {
        expect(
          resolveIdForNode(returnType, '__resolveReference', {}, args)
        ).toEqual(null)
      })
    })

    describe('When returnType is a `node`', () => {
      const returnType = createGraphQLObjectType(createObjectTypeDefinitionNode())

      it('should return the parents id if the fieldName is `__resolveReference` and parent has `id` field', () => {
        expect(
          resolveIdForNode(returnType, '__resolveReference', parent, {})
        ).toEqual(parent.id)
      })
      it('should return null if the fieldName is `__resolveReference` and parent does NOT have `id` field', () => {
        expect(
          resolveIdForNode(returnType, '__resolveReference', {}, {})
        ).toEqual(null)
      })
      it('should return the args id if the fieldName is NOT `__resolveReference` and args has `id` field', () => {
        expect(
          resolveIdForNode(returnType, 'test', {}, args)
        ).toEqual(args.id)
      })
      it('should return null if the fieldName is NOT `__resolveReference` and args does NOT have `id` field', () => {
        expect(
          resolveIdForNode(returnType, 'test', {}, {})
        ).toEqual(null)
      })
    })
  }) // END resolveIdForNode tests
}
