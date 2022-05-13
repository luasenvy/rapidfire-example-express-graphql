/* **************************************************************************
 *   ██╗  ███╗   ███╗  ██████╗    ██████╗   ██████╗   ████████╗  ███████╗   *
 *   ██║  ████╗ ████║  ██╔══██╗  ██╔═══██╗  ██╔══██╗  ╚══██╔══╝  ██╔════╝   *
 *   ██║  ██╔████╔██║  ██████╔╝  ██║   ██║  ██████╔╝     ██║     ███████╗   *
 *   ██║  ██║╚██╔╝██║  ██╔═══╝   ██║   ██║  ██╔══██╗     ██║     ╚════██║   *
 *   ██║  ██║ ╚═╝ ██║  ██║       ╚██████╔╝  ██║  ██║     ██║     ███████║   *
 *   ╚═╝  ╚═╝     ╚═╝  ╚═╝        ╚═════╝   ╚═╝  ╚═╝     ╚═╝     ╚══════╝   *
 ************************************************************************** */
import ElasticsearchSchema from '../interfaces/ElasticsearchSchema.js'

/* **************************************************************************
 *                  ██╗   ██╗   █████╗   ██████╗   ███████╗                 *
 *                  ██║   ██║  ██╔══██╗  ██╔══██╗  ██╔════╝                 *
 *                  ██║   ██║  ███████║  ██████╔╝  ███████╗                 *
 *                  ╚██╗ ██╔╝  ██╔══██║  ██╔══██╗  ╚════██║                 *
 *                   ╚████╔╝   ██║  ██║  ██║  ██║  ███████║                 *
 *                    ╚═══╝    ╚═╝  ╚═╝  ╚═╝  ╚═╝  ╚══════╝                 *
 ************************************************************************** */

/* **************************************************************************
 *                      ██████╗   ██╗   ██╗  ███╗   ██╗                     *
 *                      ██╔══██╗  ██║   ██║  ████╗  ██║                     *
 *                      ██████╔╝  ██║   ██║  ██╔██╗ ██║                     *
 *                      ██╔══██╗  ██║   ██║  ██║╚██╗██║                     *
 *                      ██║  ██║  ╚██████╔╝  ██║ ╚████║                     *
 *                      ╚═╝  ╚═╝   ╚═════╝   ╚═╝  ╚═══╝                     *
 ************************************************************************** */
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
        updatedAt: Date
        createdAt: Date
      }

      extend type Query {
        users: [User]
        user(_id: String!): User
      }

      extend type Mutation {
        createUser(user: UserInput): User
        updateUser(_id: String!, user: UserInput): User
        deleteUser(_id: String!): Void
      }
    `

    this.queries = {
      users: this.getUsers.bind(this),
      user: this.getUser.bind(this),
    }

    this.mutations = {
      createUser: this.createUser.bind(this),
      updateUser: this.updateUser.bind(this),
      deleteUser: this.deleteUser.bind(this),
    }
  }

  async deleteUser(args, { _id: id }) {
    await this.elastic.delete({ index: this.index, id, refresh: 'wait_for' })
    return
  }

  async updateUser(args, { _id: id, user }) {
    const updatedAt = new Date()
    await this.elastic.update({
      index: this.index,
      refresh: 'wait_for',
      id,
      body: {
        doc: {
          ...user,
          updatedAt,
        },
      },
    })

    return { ...user, updatedAt }
  }

  async createUser(args, { user }) {
    const createdAt = new Date()
    const {
      body: { _id },
    } = await this.elastic.index({
      index: this.index,
      refresh: 'wait_for',
      body: {
        ...user,
        createdAt,
      },
    })

    return { ...user, _id, createdAt }
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

/* **************************************************************************
 *      ██████╗   ███████╗  ████████╗  ██╗   ██╗  ██████╗   ███╗   ██╗      *
 *      ██╔══██╗  ██╔════╝  ╚══██╔══╝  ██║   ██║  ██╔══██╗  ████╗  ██║      *
 *      ██████╔╝  █████╗       ██║     ██║   ██║  ██████╔╝  ██╔██╗ ██║      *
 *      ██╔══██╗  ██╔══╝       ██║     ██║   ██║  ██╔══██╗  ██║╚██╗██║      *
 *      ██║  ██║  ███████╗     ██║     ╚██████╔╝  ██║  ██║  ██║ ╚████║      *
 *      ╚═╝  ╚═╝  ╚══════╝     ╚═╝      ╚═════╝   ╚═╝  ╚═╝  ╚═╝  ╚═══╝      *
 ************************************************************************** */
export default User
