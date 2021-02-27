const {
  Interfaces: { Service },
} = require('@luasenvy/rapidfire')

const GraphqlServiceLoader = require('../loaders/GraphqlServiceLoaders')

class GraphqlService extends Service {
  static loader = GraphqlServiceLoader

  constructor({ elastic }) {
    super()

    this.elastic = elastic
  }
}

module.exports = GraphqlService
