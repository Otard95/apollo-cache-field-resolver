import casual from 'casual'
import { GraphQLObjectType, GraphQLScalarType } from 'graphql'
import * as cacheKey from '../../src/cache-key'
import { CacheKeyType, CacheOptions } from '../../src/types'
import {
  createObjectTypeDefinitionNode,
  createGraphQLObjectType,
  createGraphQLScalarType,
  createGraphQLResolveInfo,
} from '../helpers'
const {
  resolveId,
  resolveCacheKey,
  isNode,
} = cacheKey

export default () => {
  describe('resolveId', () => {
    describe('When `KeyType` is `node-id` and returnType is `node`', () => {
      const returnType = createGraphQLObjectType(createObjectTypeDefinitionNode())
      const parent = { id: '8bff3cbb-bf25-49f2-8fc9-9b64dbb25461' }
      const args = { id: 'ffcaf652-65e1-4e1a-8096-5a20853cbd6c' }
      const spy = jest.spyOn(cacheKey, 'resolveIdForNode')

      it('should return the parent id if `info.fieldName` is `__resolveReference`', () => {
        spy.mockClear()
        const info = createGraphQLResolveInfo({
          returnType,
          parentType: createGraphQLObjectType(),
          fieldName: '__resolveReference',
        })
        expect(
          resolveId(
            'node-id',
            info,
            parent,
            args
          )
        ).toEqual(parent.id)
        expect(spy).toHaveBeenCalledWith(returnType, info.fieldName, parent, args)
      })

      it('should return null if `info.fieldName` is `__resolveReference` and parent does NOT have an id', () => {
        spy.mockClear()
        const info = createGraphQLResolveInfo({
          returnType,
          parentType: createGraphQLObjectType(),
          fieldName: '__resolveReference',
        })
        expect(
          resolveId(
            'node-id',
            info,
            {},
            args
          )
        ).toEqual(null)
        expect(spy).toHaveBeenCalledWith(returnType, info.fieldName, {}, args)
      })

      it('should return the args id if `info.fieldName` is NOT `__resolveReference`', () => {
        spy.mockClear()
        const info = createGraphQLResolveInfo({
          returnType,
          parentType: createGraphQLObjectType(),
        })
        expect(
          resolveId(
            'node-id',
            info,
            parent,
            args
          )
        ).toEqual(args.id)
        expect(spy).toHaveBeenCalledWith(returnType, info.fieldName, parent, args)
      })

      it('should return null if `info.fieldName` is NOT `__resolveReference` and args does NOT have an id', () => {
        spy.mockClear()
        const info = createGraphQLResolveInfo({
          returnType,
          parentType: createGraphQLObjectType(),
        })
        expect(
          resolveId(
            'node-id',
            info,
            parent,
            {}
          )
        ).toEqual(null)
        expect(spy).toHaveBeenCalledWith(returnType, info.fieldName, parent, {})
      })
    })

    describe('When `KeyType` is `parent-field`', () => {
      const parent = { id: '2324b247-b158-4862-a419-41153d5675c2' }

      it('should return the parent id if the parent is a `node`', () => {
        const parentType = createGraphQLObjectType(createObjectTypeDefinitionNode())
        const info = createGraphQLResolveInfo({
          returnType: createGraphQLScalarType(),
          parentType,
        })
        expect(
          resolveId(
            'parent-field',
            info,
            parent,
            {}
          )
        ).toEqual(parent.id)
      })

      it('should return null if the parent is NOT a `node`', () => {
        const info = createGraphQLResolveInfo({
          returnType: createGraphQLScalarType(),
          parentType: createGraphQLObjectType(),
        })
        expect(
          resolveId(
            'parent-field',
            info,
            parent,
            {}
          )
        ).toEqual(null)
      })

      it('should return null if the parent is a `node`, but does not have its id specified', () => {
        const parentType = createGraphQLObjectType(createObjectTypeDefinitionNode())
        const info = createGraphQLResolveInfo({
          returnType: createGraphQLScalarType(),
          parentType,
        })
        expect(
          resolveId(
            'parent-field',
            info,
            {},
            {}
          )
        ).toEqual(null)
      })
    })
  }) // END resolveId tests

  describe('resolveCacheKey', () => {

    type CaseExpect =
      'node-id-parent'
      | 'node-id-args'
      | 'node-id-fn'
      | 'parent-field-parent'
      | 'parent-field-fn'
      | 'null'
    type ParentType = GraphQLObjectType
    type ReturnType = GraphQLObjectType | GraphQLScalarType
    type SessId = string | null
    type Parent = { id?: string }
    type Args = { id?: string }
    type Options = 'none' | 'node' | 'parent' | 'fn' | 'node-fn' | 'parent-fn'
    type Case = [SessId, ParentType, ReturnType, string, Parent, Args, Options, CaseExpect]

    const node = () => createGraphQLObjectType(createObjectTypeDefinitionNode())
    const object = () => createGraphQLObjectType()
    const withId = () => ({ id: casual.uuid })

    const expectText = {
      'node-id-parent': 'should return `node-id` type cache key with parents id',
      'node-id-args': 'should return `node-id` type cache key with args id',
      'node-id-fn': 'should return `node-id` type cache key with id resolved by `options.nodeId`',
      'parent-field-parent': 'should return `parent-field` type cache key with parents id',
      'parent-field-fn': 'should return `parent-field` type cache key with id resolved by `options.nodeId`',
      'null': 'should return `null`',
    }

    const cacheKeyType = (options: Options) => {
      if (options.includes('parent')) return 'parent-field'
      if (options.includes('node')) return 'node-id'
      return ''
    }
    const describeOptions = (options: Options) => {
      const sections = []
      if (['node', 'parent', 'node-fn', 'parent-fn'].includes(options))
        sections.push('`options.cacheKeyType` is `' + cacheKeyType(options) + '`')

      if (['fn', 'node-fn', 'parent-fn'].includes(options))
        sections.push('`options.nodeId` is provided')

      return `When ${sections.length === 0 ? 'no options are provided' : sections.join(' and ')}`
    }

    const createOptions = (optType: Options, nodeId: () => string) => {
      switch (optType) {
        case 'none'     : return {}
        case 'node'     : return { cacheKeyType: 'node-id' }
        case 'parent'   : return { cacheKeyType: 'parent-field' }
        case 'fn'       : return { nodeId }
        case 'node-fn'  : return { cacheKeyType: 'node-id', nodeId }
        case 'parent-fn': return { cacheKeyType: 'parent-field', nodeId }
      }
    }

    const expectKey = (
      expectType: CaseExpect,
      sessionId: SessId,
      parentType: ParentType,
      returnType: ReturnType,
      fieldName: string,
      parent: Parent,
      args: Args,
      options: { cacheKeyType?: CacheKeyType, nodeId?: () => string }
    ) => {
      let node: ParentType | ReturnType | undefined
      let nodeId: string | undefined

      switch (expectType) {
        case 'null': return null

        case 'node-id-parent':
          node = returnType
          nodeId = parent.id
          return `${sessionId ? `<${sessionId}>` : ''}${node.name}.${nodeId}`

        case 'node-id-args':
          node = returnType
          nodeId = args.id
          return `${sessionId ? `<${sessionId}>` : ''}${node.name}.${nodeId}`

        case 'node-id-fn':
          node = returnType
          nodeId = ('nodeId' in options) ? (options as { nodeId: () => string }).nodeId() : undefined
          return `${sessionId ? `<${sessionId}>` : ''}${node.name}.${nodeId}`

        case 'parent-field-parent':
          nodeId = parent.id
          return `${sessionId
            ? `<${sessionId}>`
            : ''
            }${parentType.name}{${nodeId}}.${fieldName}(${JSON.stringify(
              args
            )})`

        case 'parent-field-fn':
          nodeId = ('nodeId' in options) ? (options as { nodeId: () => string }).nodeId() : undefined
          return `${sessionId
            ? `<${sessionId}>`
            : ''
            }${parentType.name}{${nodeId}}.${fieldName}(${JSON.stringify(
              args
            )})`
      }
    }

    const cases: Case[] = [
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     '__resolveReference', withId(), withId(), 'none',      'node-id-parent'],
      [  null,      node(),     node(),     '__resolveReference', withId(), withId(), 'node',      'node-id-parent'],
      [  null,      node(),     node(),     '__resolveReference', withId(), withId(), 'parent',    'parent-field-parent'],
      [  null,      node(),     node(),     '__resolveReference', withId(), withId(), 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', withId(), withId(), 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', withId(), withId(), 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     '__resolveReference', withId(), {}      , 'none',      'node-id-parent'],
      [  null,      node(),     node(),     '__resolveReference', withId(), {}      , 'node',      'node-id-parent'],
      [  null,      node(),     node(),     '__resolveReference', withId(), {}      , 'parent',    'parent-field-parent'],
      [  null,      node(),     node(),     '__resolveReference', withId(), {}      , 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', withId(), {}      , 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', withId(), {}      , 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     '__resolveReference', {}      , withId(), 'none',      'null'],
      [  null,      node(),     node(),     '__resolveReference', {}      , withId(), 'node',      'null'],
      [  null,      node(),     node(),     '__resolveReference', {}      , withId(), 'parent',    'null'],
      [  null,      node(),     node(),     '__resolveReference', {}      , withId(), 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', {}      , withId(), 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', {}      , withId(), 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     '__resolveReference', {}      , {}      , 'none',      'null'],
      [  null,      node(),     node(),     '__resolveReference', {}      , {}      , 'node',      'null'],
      [  null,      node(),     node(),     '__resolveReference', {}      , {}      , 'parent',    'null'],
      [  null,      node(),     node(),     '__resolveReference', {}      , {}      , 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', {}      , {}      , 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     '__resolveReference', {}      , {}      , 'parent-fn', 'parent-field-fn'],

      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     casual.word,          withId(), withId(), 'none',      'node-id-args'],
      [  null,      node(),     node(),     casual.word,          withId(), withId(), 'node',      'node-id-args'],
      [  null,      node(),     node(),     casual.word,          withId(), withId(), 'parent',    'parent-field-parent'],
      [  null,      node(),     node(),     casual.word,          withId(), withId(), 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          withId(), withId(), 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          withId(), withId(), 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     casual.word,          withId(), {}      , 'none',      'null'],
      [  null,      node(),     node(),     casual.word,          withId(), {}      , 'node',      'null'],
      [  null,      node(),     node(),     casual.word,          withId(), {}      , 'parent',    'parent-field-parent'],
      [  null,      node(),     node(),     casual.word,          withId(), {}      , 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          withId(), {}      , 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          withId(), {}      , 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     casual.word,          {}      , withId(), 'none',      'node-id-args'],
      [  null,      node(),     node(),     casual.word,          {}      , withId(), 'node',      'node-id-args'],
      [  null,      node(),     node(),     casual.word,          {}      , withId(), 'parent',    'null'],
      [  null,      node(),     node(),     casual.word,          {}      , withId(), 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          {}      , withId(), 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          {}      , withId(), 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     node(),     casual.word,          {}      , {}      , 'none',      'null'],
      [  null,      node(),     node(),     casual.word,          {}      , {}      , 'node',      'null'],
      [  null,      node(),     node(),     casual.word,          {}      , {}      , 'parent',    'null'],
      [  null,      node(),     node(),     casual.word,          {}      , {}      , 'fn',        'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          {}      , {}      , 'node-fn',   'node-id-fn'],
      [  null,      node(),     node(),     casual.word,          {}      , {}      , 'parent-fn', 'parent-field-fn'],

      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     object(),   casual.word,          withId(), withId(), 'none',      'parent-field-parent'],
      [  null,      node(),     object(),   casual.word,          withId(), withId(), 'node',      'null'],
      [  null,      node(),     object(),   casual.word,          withId(), withId(), 'parent',    'parent-field-parent'],
      [  null,      node(),     object(),   casual.word,          withId(), withId(), 'fn',        'parent-field-fn'],
      [  null,      node(),     object(),   casual.word,          withId(), withId(), 'node-fn',   'null'],
      [  null,      node(),     object(),   casual.word,          withId(), withId(), 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     object(),   casual.word,          withId(), {}      , 'none',      'parent-field-parent'],
      [  null,      node(),     object(),   casual.word,          withId(), {}      , 'node',      'null'],
      [  null,      node(),     object(),   casual.word,          withId(), {}      , 'parent',    'parent-field-parent'],
      [  null,      node(),     object(),   casual.word,          withId(), {}      , 'fn',        'parent-field-fn'],
      [  null,      node(),     object(),   casual.word,          withId(), {}      , 'node-fn',   'null'],
      [  null,      node(),     object(),   casual.word,          withId(), {}      , 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     object(),   casual.word,          {}      , withId(), 'none',      'null'],
      [  null,      node(),     object(),   casual.word,          {}      , withId(), 'node',      'null'],
      [  null,      node(),     object(),   casual.word,          {}      , withId(), 'parent',    'null'],
      [  null,      node(),     object(),   casual.word,          {}      , withId(), 'fn',        'parent-field-fn'],
      [  null,      node(),     object(),   casual.word,          {}      , withId(), 'node-fn',   'null'],
      [  null,      node(),     object(),   casual.word,          {}      , withId(), 'parent-fn', 'parent-field-fn'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      node(),     object(),   casual.word,          {}      , {}      , 'none',      'null'],
      [  null,      node(),     object(),   casual.word,          {}      , {}      , 'node',      'null'],
      [  null,      node(),     object(),   casual.word,          {}      , {}      , 'parent',    'null'],
      [  null,      node(),     object(),   casual.word,          {}      , {}      , 'fn',        'parent-field-fn'],
      [  null,      node(),     object(),   casual.word,          {}      , {}      , 'node-fn',   'null'],
      [  null,      node(),     object(),   casual.word,          {}      , {}      , 'parent-fn', 'parent-field-fn'],

      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   node(),     casual.word,          withId(), withId(), 'none',      'node-id-args'],
      [  null,      object(),   node(),     casual.word,          withId(), withId(), 'node',      'node-id-args'],
      [  null,      object(),   node(),     casual.word,          withId(), withId(), 'parent',    'null'],
      [  null,      object(),   node(),     casual.word,          withId(), withId(), 'fn',        'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          withId(), withId(), 'node-fn',   'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          withId(), withId(), 'parent-fn', 'null'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   node(),     casual.word,          withId(), {}      , 'none',      'null'],
      [  null,      object(),   node(),     casual.word,          withId(), {}      , 'node',      'null'],
      [  null,      object(),   node(),     casual.word,          withId(), {}      , 'parent',    'null'],
      [  null,      object(),   node(),     casual.word,          withId(), {}      , 'fn',        'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          withId(), {}      , 'node-fn',   'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          withId(), {}      , 'parent-fn', 'null'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   node(),     casual.word,          {}      , withId(), 'none',      'node-id-args'],
      [  null,      object(),   node(),     casual.word,          {}      , withId(), 'node',      'node-id-args'],
      [  null,      object(),   node(),     casual.word,          {}      , withId(), 'parent',    'null'],
      [  null,      object(),   node(),     casual.word,          {}      , withId(), 'fn',        'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          {}      , withId(), 'node-fn',   'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          {}      , withId(), 'parent-fn', 'null'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   node(),     casual.word,          {}      , {}      , 'none',      'null'],
      [  null,      object(),   node(),     casual.word,          {}      , {}      , 'node',      'null'],
      [  null,      object(),   node(),     casual.word,          {}      , {}      , 'parent',    'null'],
      [  null,      object(),   node(),     casual.word,          {}      , {}      , 'fn',        'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          {}      , {}      , 'node-fn',   'node-id-fn'],
      [  null,      object(),   node(),     casual.word,          {}      , {}      , 'parent-fn', 'null'],

      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   object(),   casual.word,          withId(), withId(), 'none',      'null'],
      [  null,      object(),   object(),   casual.word,          withId(), withId(), 'node',      'null'],
      [  null,      object(),   object(),   casual.word,          withId(), withId(), 'parent',    'null'],
      [  null,      object(),   object(),   casual.word,          withId(), withId(), 'fn',        'null'],
      [  null,      object(),   object(),   casual.word,          withId(), withId(), 'node-fn',   'null'],
      [  null,      object(),   object(),   casual.word,          withId(), withId(), 'parent-fn', 'null'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   object(),   casual.word,          withId(), {}      , 'none',      'null'],
      [  null,      object(),   object(),   casual.word,          withId(), {}      , 'node',      'null'],
      [  null,      object(),   object(),   casual.word,          withId(), {}      , 'parent',    'null'],
      [  null,      object(),   object(),   casual.word,          withId(), {}      , 'fn',        'null'],
      [  null,      object(),   object(),   casual.word,          withId(), {}      , 'node-fn',   'null'],
      [  null,      object(),   object(),   casual.word,          withId(), {}      , 'parent-fn', 'null'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   object(),   casual.word,          {}      , withId(), 'none',      'null'],
      [  null,      object(),   object(),   casual.word,          {}      , withId(), 'node',      'null'],
      [  null,      object(),   object(),   casual.word,          {}      , withId(), 'parent',    'null'],
      [  null,      object(),   object(),   casual.word,          {}      , withId(), 'fn',        'null'],
      [  null,      object(),   object(),   casual.word,          {}      , withId(), 'node-fn',   'null'],
      [  null,      object(),   object(),   casual.word,          {}      , withId(), 'parent-fn', 'null'],
      // sessionId, parentType, returnType, fieldName,            parent,   args,     options,     expected
      [  null,      object(),   object(),   casual.word,          {}      , {}      , 'none',      'null'],
      [  null,      object(),   object(),   casual.word,          {}      , {}      , 'node',      'null'],
      [  null,      object(),   object(),   casual.word,          {}      , {}      , 'parent',    'null'],
      [  null,      object(),   object(),   casual.word,          {}      , {}      , 'fn',        'null'],
      [  null,      object(),   object(),   casual.word,          {}      , {}      , 'node-fn',   'null'],
      [  null,      object(),   object(),   casual.word,          {}      , {}      , 'parent-fn', 'null'],
    ]

    cases.forEach(([sessionId, parentType, returnType, fieldName, parent, args, optType, expected]) => {
      describe(`When sessionId is ${sessionId}`, () => {
        describe(`When parentType is ${isNode(parentType) ? '`node`' : 'NOT `node`'}`, () => {
          describe(`When returnType is ${isNode(returnType) ? '`node`' : 'NOT `node`'}`, () => {
            describe(`When fieldName is ${fieldName === '__resolveReference' ? '__resolveReference' : 'NOT __resolveReference'}`, () => {
              describe(`When parent ${'id' in parent ? 'has' : 'does not have'} id`, () => {
                describe(`When args ${'id' in args ? 'has' : 'does not have'} id`, () => {
                  describe(describeOptions(optType), () => {
                    const id = casual.uuid
                    const nodeId = jest.fn(() => id)
                    const options = createOptions(optType, nodeId)
                    it(expectText[expected], () => {
                      const info = createGraphQLResolveInfo({
                        returnType,
                        parentType,
                        fieldName,
                      })
                      expect(
                        resolveCacheKey(
                          options as CacheOptions<any, any, any>,
                          sessionId,
                          info,
                          parent,
                          args,
                          {},
                        )
                      ).toEqual(expectKey(
                        expected,
                        sessionId,
                        parentType,
                        returnType,
                        fieldName,
                        parent,
                        args,
                        options as any
                      ))
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  }) // END resolveCacheKey
}
