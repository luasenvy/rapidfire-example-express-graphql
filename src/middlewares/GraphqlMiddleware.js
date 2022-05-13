/* **************************************************************************
 *   ██╗  ███╗   ███╗  ██████╗    ██████╗   ██████╗   ████████╗  ███████╗   *
 *   ██║  ████╗ ████║  ██╔══██╗  ██╔═══██╗  ██╔══██╗  ╚══██╔══╝  ██╔════╝   *
 *   ██║  ██╔████╔██║  ██████╔╝  ██║   ██║  ██████╔╝     ██║     ███████╗   *
 *   ██║  ██║╚██╔╝██║  ██╔═══╝   ██║   ██║  ██╔══██╗     ██║     ╚════██║   *
 *   ██║  ██║ ╚═╝ ██║  ██║       ╚██████╔╝  ██║  ██║     ██║     ███████║   *
 *   ╚═╝  ╚═╝     ╚═╝  ╚═╝        ╚═════╝   ╚═╝  ╚═╝     ╚═╝     ╚══════╝   *
 ************************************************************************** */
import { join as pathJoin, dirname as pathDirname } from 'path'
import { statSync as fsStatSync, readdirSync as fsReaddirSync } from 'fs'
import { fileURLToPath as urlFileURLToPath } from 'url'

import { Interfaces } from '@luasenvy/rapidfire'

import { graphqlHTTP as expressGraphql } from 'express-graphql'
import { GraphQLScalarType } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'

/* **************************************************************************
 *                  ██╗   ██╗   █████╗   ██████╗   ███████╗                 *
 *                  ██║   ██║  ██╔══██╗  ██╔══██╗  ██╔════╝                 *
 *                  ██║   ██║  ███████║  ██████╔╝  ███████╗                 *
 *                  ╚██╗ ██╔╝  ██╔══██║  ██╔══██╗  ╚════██║                 *
 *                   ╚████╔╝   ██║  ██║  ██║  ██║  ███████║                 *
 *                    ╚═══╝    ╚═╝  ╚═╝  ╚═╝  ╚═╝  ╚══════╝                 *
 ************************************************************************** */
const __dirname = pathDirname(urlFileURLToPath(import.meta.url))

const constants = {
  defaults: {
    graphqlSchema: {
      typeDefs: `
      type Query
      type Mutation

      scalar Date
      scalar Void
    `,
      resolvers: {
        Query: {},
        Mutation: {},
        Void: new GraphQLScalarType({
          name: 'Void',
          description: 'Void Scalar Type',
          serialize: () => undefined,
          parseValue: () => undefined,
          parseLiteral: () => undefined,
        }),
        Date: new GraphQLScalarType({
          name: 'Date',
          description: 'Date Scalar Type',
          serialize(value) {
            return value.toISOString()
          },
          parseValue(value) {
            return new Date(value)
          },
          parseLiteral({ value }) {
            return new Date(value)
          },
        }),
      },
    },
  },
  paths: {
    graphql: {
      schemas: pathJoin(__dirname, '../graphql/schemas'),
    },
  },
}

const fn = {
  getSchemasRecursively({ parent, filename }) {
    const filepath = pathJoin(parent, filename)

    if (fsStatSync(filepath).isFile()) {
      if (filename.endsWith('.js')) return filepath
      return
    }

    return fsReaddirSync(filepath).flatMap(filename => fn.getSchemasRecursively({ parent: filepath, filename }))
  },
  getSchemaPathnames({ docroot }) {
    const schemaFilenames = fsReaddirSync(docroot)
    const schemaPathnames = schemaFilenames.flatMap(schemaFileName => fn.getSchemasRecursively({ parent: docroot, filename: schemaFileName })).filter(Boolean)
    return schemaPathnames
  },
}

/* **************************************************************************
 *                      ██████╗   ██╗   ██╗  ███╗   ██╗                     *
 *                      ██╔══██╗  ██║   ██║  ████╗  ██║                     *
 *                      ██████╔╝  ██║   ██║  ██╔██╗ ██║                     *
 *                      ██╔══██╗  ██║   ██║  ██║╚██╗██║                     *
 *                      ██║  ██║  ╚██████╔╝  ██║ ╚████║                     *
 *                      ╚═╝  ╚═╝   ╚═════╝   ╚═╝  ╚═══╝                     *
 ************************************************************************** */
class GraphqlMiddleware extends Interfaces.Middleware {
  constructor() {
    super()

    this.schemas = []
    this.expressGraphql = null
  }

  async init() {
    const schemaPathnames = fn.getSchemaPathnames({ docroot: constants.paths.graphql.schemas })

    // Load Schemas
    this.schemas = await Promise.all(
      schemaPathnames.map(async schemaPathname => {
        const { default: Schema } = await import(schemaPathname)

        const schema = new Schema()
        schema.$rapidfire = this.$rapidfire
        return schema
      })
    )

    // Init Schemas

    for (const schema of this.schemas) await schema.init()

    const { typeDefs, resolvers } = this.schemas.reduce(
      (acc, { typedef, queries, mutations }) =>
        Object.assign(acc, {
          typeDefs: acc.typeDefs.concat(typedef),
          resolvers: {
            Query: Object.assign(acc.resolvers.Query, queries),
            Mutation: Object.assign(acc.resolvers.Mutation, mutations),
          },
        }),
      { typeDefs: constants.defaults.graphqlSchema.typeDefs, resolvers: constants.defaults.graphqlSchema.resolvers }
    )

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    this.expressGraphql = expressGraphql({ schema, graphiql: true })

    this.pipelines.push({ pattern: '/graphql', pipe: this.expressGraphql })
  }

  toKebabCase(str) {
    return str.replace(/(?!^[A-Z])([A-Z])/g, '-$1').toLowerCase()
  }
}

/* **************************************************************************
 *      ██████╗   ███████╗  ████████╗  ██╗   ██╗  ██████╗   ███╗   ██╗      *
 *      ██╔══██╗  ██╔════╝  ╚══██╔══╝  ██║   ██║  ██╔══██╗  ████╗  ██║      *
 *      ██████╔╝  █████╗       ██║     ██║   ██║  ██████╔╝  ██╔██╗ ██║      *
 *      ██╔══██╗  ██╔══╝       ██║     ██║   ██║  ██╔══██╗  ██║╚██╗██║      *
 *      ██║  ██║  ███████╗     ██║     ╚██████╔╝  ██║  ██║  ██║ ╚████║      *
 *      ╚═╝  ╚═╝  ╚══════╝     ╚═╝      ╚═════╝   ╚═╝  ╚═╝  ╚═╝  ╚═══╝      *
 ************************************************************************** */
export default GraphqlMiddleware
