# Apollo Cache Field Resolver (WIP)

The aim of this simple resolver wrapper is to enable caching on a field level
basis, as apposed to the
[Apollo Response Cache](https://www.npmjs.com/package/apollo-server-plugin-response-cache)

## Spec

### Cache Key Variants

There should be some default(s) for how to generate cache keys, and perhaps
the option for a custom function to generate it.

For example:
 - `node-id` -> the `node` name + the `node` id.
 - `parent-field` -> the parent `node` name + the field name + the parents id +
   field arguments.
 - `custom` -> a function that returns a key given the resolved cache key type,
   the info object, the parent, and args.

**node**(definition) - A graphql `type` with the `@key` directive.

#### Issues/Prerequisites

 1. For `node-id` how to resolve the id before the node is fetched.
 2. For `parent-field` parent must be a node.

#### Possible solutions

 1. For `__resolveReference` fields use `@key` directives `fields` argument.
    to get it from parent.
 1. For any other case assume args contains the `fields` of the `@key` directive.
   - Better solution for later could be recursively looking through the input ast
     to find a single field with type `ID!`, and/or finding a key `id` or
     containing `id`(respecting snake/camel etc. case)
 2. For `parent-field` The parent may not exist, like in the case for a `query`.

## TODO

 - [ ] Prettify generated `.d.ts`
 - [ ] Improve `ID!` resolving for `node-id` cache key variant
 - [ ] Improve Docs
