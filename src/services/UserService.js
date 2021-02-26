const GraphqlService = require('../interfaces/GraphqlService')

class UserService extends GraphqlService {
  constructor({ router }) {
    super()

    router.get('/api/users', (req, res, next) => this.searchUser(req, res).catch(next))

    this.router = router
  }

  async searchUser(req, res) {
    res.send({})
  }
}

module.exports = UserService
