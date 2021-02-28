const { Client: Elasticsearch } = require('@elastic/elasticsearch')

class ElasticsearchSchema {
  constructor({ index }) {
    this.$rapidfire = null
    this.index = this.toKebabCase(index || ElasticsearchSchema.name)
  }

  async init() {
    this.elastic = this.$rapidfire.dbs.find(db => db instanceof Elasticsearch)

    // Init Elasticsearch Index
    try {
      await this.elastic.indices.get({ index: this.index })
    } catch (err) {
      if (err.body.error.type === 'index_not_found_exception') await this.elastic.indices.create({ index: this.index, wait_for_active_shards: 'all' })
      // Ignore Others
    }
  }

  toKebabCase(str) {
    return str.replace(/(?!^[A-Z])([A-Z])/g, '-$1').toLowerCase()
  }
}

module.exports = ElasticsearchSchema
