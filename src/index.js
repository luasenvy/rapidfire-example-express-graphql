const path = require('path')

const { RapidFire } = require('@luasenvy/rapidfire')

const constants = {}

const fn = {
  gracefulShutdown({ err, eventName }) {
    if (err) console.error(eventName, err)
    process.exit(0)
  },
}

async function main() {
  try {
    const rapidFire = new RapidFire({
      host: 'localhost',
      port: 8000,
      paths: {
        middlewares: path.join(__dirname, 'middlewares'),
        services: path.join(__dirname, 'services'),
      },
      dbs: []
    })

    try {
      // 비정상 종료시 자동 close 진행
      process.on('exit', err => fn.gracefulShutdown({ err, eventName: 'exit' }))
      process.on('SIGINT', err => fn.gracefulShutdown({ err, eventName: 'SIGINT' }))
      process.on('SIGTERM', err => fn.gracefulShutdown({ err, eventName: 'SIGTERM' }))
      process.on('uncaughtException', err => fn.gracefulShutdown({ err, eventName: 'uncaughtException' }))
      process.on('SIGKILL', err => fn.gracefulShutdown({ err, eventName: 'SIGKILL' })) // nodemon처럼 SIGKILL 명령에 의해 종료될 때
    } catch (err) {
      // process.on('SIGKILL') 을 사용할 때 uv_signal_start EINVAL 오류가 throws될 수 있음.
      if (err.code !== 'EINVAL') {
        console.error(err)
        return fn.gracefulShutdown({ err, eventName: err.code })
      }
    }

    rapidFire.ignition()
  } catch (err) {
    console.error(err)
  }
}

main()
