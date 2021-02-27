const ElasticsearchSchema = require('../interfaces/ElasticsearchSchema')

class User extends ElasticsearchSchema {
  constructor() {
    super({ index: User.name })

    this.typedef = `
      input UserInput {
        name: String
      }

      type User {
        _id: String
        name: String
        createdAt: Date
      }

      extend type Query {
        users: [User]
        user(_id: String!): User
      }

      extend type Mutation {
        createUser(input: UserInput): User
      }
    `

    this.queries = {
      users: this.getUsers.bind(this),
      user: this.getUser.bind(this),
    }

    this.mutations = {
      createUser: this.createUser.bind(this),
    }
  }

  async createUser(args, { input: user }) {
    const {
      body: { _id: createdId },
    } = await this.elastic.index({
      index: this.index,
      refresh: 'wait_for',
      body: {
        ...user,
        createdAt: new Date(),
      },
    })

    return Object.assign(user, { _id: createdId })
  }

  async getUsers() {
    const {
      body: {
        hits: { hits: users },
      },
    } = await this.elastic.search({
      index: this.index,
      body: {
        query: {
          match_all: {},
        },
      },
    })

    return users.map(({ _id, _source }) => ({ _id, ..._source }))
  }

  async getUser(args, { _id: id }) {
    const {
      body: { _id, _source },
    } = await this.elastic.get({ index: this.index, id })

    return { _id, ..._source }
  }
}

module.exports = User
