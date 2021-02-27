const {
  Interfaces: { ServiceLoader },
} = require('@luasenvy/rapidfire')

const { Client: Elasticsearch } = require('@elastic/elasticsearch')

class GraphqlServiceLoader extends ServiceLoader {
  constructor() {
    super()
  }

  load({ express, Service: GraphqlService }) {
    const elastic = this.$rapidfire.dbs.find(db => db instanceof Elasticsearch)
    return new GraphqlService({ router: express.Router(), elastic })
  }
}

module.exports = GraphqlServiceLoader
