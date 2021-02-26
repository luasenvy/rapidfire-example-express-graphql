class User {
  static indexies = { user: 'rapidfire-user' }

  constructor({ elastic }) {
    this.typeDefs = `
      type User {
        hello: String
      }
    `

    this.resolvers = {
      User: {
        getUsers: this.getUsersResolver,
      },
    }

    this.elastic = elastic
  }

  async getUsersResolver(args, context, info) {
    const {
      body: {
        hits: { hits: users },
      },
    } = await this.elastic.search({
      index: User.indexies.user,
      body: {
        query: {
          match_all: {},
        },
      },
    })

    return users
  }
}

module.exports = User
