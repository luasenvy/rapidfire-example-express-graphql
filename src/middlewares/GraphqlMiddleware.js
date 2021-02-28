const fs = require('fs')
const path = require('path')

const {
  Interfaces: { Middleware },
} = require('@luasenvy/rapidfire')

const { graphqlHTTP: expressGraphql } = require('express-graphql')
const { GraphQLScalarType } = require('graphql')
const { makeExecutableSchema } = require('@graphql-tools/schema')

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
      schemas: path.join(__dirname, '../graphql/schemas'),
    },
  },
}

const fn = {
  getSchemasRecursively({ parent, filename }) {
    const filepath = path.join(parent, filename)

    if (fs.statSync(filepath).isFile()) {
      if (filename.endsWith('.js')) return filepath
      return
    }

    return fs.readdirSync(filepath).flatMap(filename => fn.getSchemasRecursively({ parent: filepath, filename }))
  },
  getSchemaPathnames({ docroot }) {
    const schemaFilenames = fs.readdirSync(docroot)
    const schemaPathnames = schemaFilenames.flatMap(schemaFileName => fn.getSchemasRecursively({ parent: docroot, filename: schemaFileName })).filter(Boolean)
    return schemaPathnames
  },
}

class GraphqlMiddleware extends Middleware {
  constructor() {
    super()

    this.schemas = []
    this.expressGraphql = null
  }

  async init() {
    const schemaPathnames = fn.getSchemaPathnames({ docroot: constants.paths.graphql.schemas })

    // Load Schemas
    this.schemas = schemaPathnames.map(schemaPathname => {
      const Schema = require(schemaPathname)

      const schema = new Schema()
      schema.$rapidfire = this.$rapidfire
      return schema
    })

    // Init Schemas

    for (const schema of this.schemas) await schema.init()

    const { typeDefs, resolvers } = this.schemas.reduce(
      (acc, { typedef, queries, mutations }) =>
        Object.assign(acc, {
          typeDefs: acc.typeDefs.concat(typedef),
          resolvers: {
            Query: { ...acc.resolvers.Query, ...queries },
            Mutation: { ...acc.resolvers.Mutation, ...mutations },
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

module.exports = GraphqlMiddleware
