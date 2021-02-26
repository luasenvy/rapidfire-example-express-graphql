const {
  Interfaces: { Middleware },
} = require('@luasenvy/rapidfire')

const fs = require('fs')
const path = require('path')

const { graphqlHTTP: expressGraphql } = require('express-graphql')
const { makeExecutableSchema } = require('graphql')

const constants = {
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
    const elastic = this.$rapidfire.dbs.find(db => db instanceof Elasticsearch)
    const schemaPathnames = fn.getSchemaPathnames({ docroot: constants.paths.graphql.schemas })

    this.schemas = schemaPathnames.map(schemaPathname => {
      const Schema = require(schemaPathname)
      return makeExecutableSchema(new Schema({ elastic }))
    })

    this.expressGraphql = expressGraphql({ schema: schema(this.typedefs), rootValue: { hello: () => 'hello world :)' }, graphiql: true })

    this.pipelines.push({ pattern: '/graphql', pipe: this.expressGraphql })
  }
}

module.exports = GraphqlMiddleware
