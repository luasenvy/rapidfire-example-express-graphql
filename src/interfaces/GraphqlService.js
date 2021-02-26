const {
  Interfaces: { Service },
} = require('@luasenvy/rapidfire')

class GraphqlService extends Service {
  constructor() {
    super()

    this._elastic = null
  }

  get elastic() {
    return this._elastic
  }

  set elastic(elastic) {
    this._elastic = elastic
  }
}

module.exports = GraphqlService
