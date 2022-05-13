/* **************************************************************************
 *   ██╗  ███╗   ███╗  ██████╗    ██████╗   ██████╗   ████████╗  ███████╗   *
 *   ██║  ████╗ ████║  ██╔══██╗  ██╔═══██╗  ██╔══██╗  ╚══██╔══╝  ██╔════╝   *
 *   ██║  ██╔████╔██║  ██████╔╝  ██║   ██║  ██████╔╝     ██║     ███████╗   *
 *   ██║  ██║╚██╔╝██║  ██╔═══╝   ██║   ██║  ██╔══██╗     ██║     ╚════██║   *
 *   ██║  ██║ ╚═╝ ██║  ██║       ╚██████╔╝  ██║  ██║     ██║     ███████║   *
 *   ╚═╝  ╚═╝     ╚═╝  ╚═╝        ╚═════╝   ╚═╝  ╚═╝     ╚═╝     ╚══════╝   *
 ************************************************************************** */
import { join as pathJoin, dirname as pathDirname } from 'path'
import { fileURLToPath as urlFileURLToPath } from 'url'

import { Client as Elasticsearch } from '@elastic/elasticsearch'

import { RapidFire } from '@luasenvy/rapidfire'

/* **************************************************************************
 *                  ██╗   ██╗   █████╗   ██████╗   ███████╗                 *
 *                  ██║   ██║  ██╔══██╗  ██╔══██╗  ██╔════╝                 *
 *                  ██║   ██║  ███████║  ██████╔╝  ███████╗                 *
 *                  ╚██╗ ██╔╝  ██╔══██║  ██╔══██╗  ╚════██║                 *
 *                   ╚████╔╝   ██║  ██║  ██║  ██║  ███████║                 *
 *                    ╚═══╝    ╚═╝  ╚═╝  ╚═╝  ╚═╝  ╚══════╝                 *
 ************************************************************************** */
const __dirname = pathDirname(urlFileURLToPath(import.meta.url))

const constants = {
  elasticsearch: {
    node: 'http://172.30.1.2:9200/',
  },
}

const fn = {
  gracefulShutdown({ err, client, eventName }) {
    if (err) console.error(err)

    if (client && client.close instanceof Function) {
      try {
        console.debug(`[${eventName}] Database Will Be Close.`)
        client.close()
      } catch (err) {
        console.error(err)
      }
    }

    process.exit(0)
  },
}

/* **************************************************************************
 *                      ██████╗   ██╗   ██╗  ███╗   ██╗                     *
 *                      ██╔══██╗  ██║   ██║  ████╗  ██║                     *
 *                      ██████╔╝  ██║   ██║  ██╔██╗ ██║                     *
 *                      ██╔══██╗  ██║   ██║  ██║╚██╗██║                     *
 *                      ██║  ██║  ╚██████╔╝  ██║ ╚████║                     *
 *                      ╚═╝  ╚═╝   ╚═════╝   ╚═╝  ╚═══╝                     *
 ************************************************************************** */
async function main() {
  // Create a new Elasticsearch Client
  const client = new Elasticsearch(constants.elasticsearch)

  try {
    // ------------------------ Database Connection
    console.info(`Database Connected To ${constants.elasticsearch.node}`)

    const rapidFire = new RapidFire({
      host: 'localhost',
      port: 8000,
      paths: {
        middlewares: pathJoin(__dirname, 'middlewares'),
      },
      dbs: [client],
    })

    try {
      // 비정상 종료시 자동 close 진행
      process.on('exit', err => fn.gracefulShutdown({ err, client, eventName: 'exit' }))
      process.on('SIGINT', err => fn.gracefulShutdown({ err, client, eventName: 'SIGINT' }))
      process.on('SIGTERM', err => fn.gracefulShutdown({ err, client, eventName: 'SIGTERM' }))
      process.on('uncaughtException', err => fn.gracefulShutdown({ err, client, eventName: 'uncaughtException' }))
      process.on('SIGKILL', err => fn.gracefulShutdown({ err, client, eventName: 'SIGKILL' })) // nodemon처럼 SIGKILL 명령에 의해 종료될 때
    } catch (err) {
      // process.on('SIGKILL') 을 사용할 때 uv_signal_start EINVAL 오류가 throws될 수 있음.
      if (err.code !== 'EINVAL') {
        console.error(err)
        return fn.gracefulShutdown({ err, client, eventName: err.code })
      }
    }

    rapidFire.ignition()
  } catch (err) {
    console.error(err)
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
main()
