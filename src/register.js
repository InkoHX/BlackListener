const logger = require('./logger').getLogger('main:event', 'purple')
const c = require('./config.yml')
const fs = require('fs').promises
const os = require('os')
const share = require('./share')
const git = require('simple-git/promise')()

const codeblock = code => '```' + code + '```'
const ucfirst = text => text.charAt(0).toUpperCase() + text.slice(1)

async function makeReport(client, error, type) {
  const date = new Date()
  const description = type === 'error'
    ? 'Unhandled Rejection(Exception/Error in Promise).'
    : 'Uncaught error.'
  const format = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`
  const argv = process.argv.map((val, index) => `arguments[${index}]: ${val}`)
  const commit = await git.revparse(['HEAD'])
  const data =  `
--- BlackListener ${ucfirst(type)} Report ---

Time: ${format}
Description: ${description}

${error.stack}

--- Process Details ---
    Last Called Logger Thread: ${share.thread} (may not current thread)

    BlackListener Version: ${c.version}
    BlackListener Commit: ${commit}

    Arguments: ${process.argv.length}
    ${argv.join('\n    ')}

    Launched in PID: ${process.pid}

    Remote control: ${process.env.ENABLE_RCON ? 'Enabled' : 'Disabled'}
    Custom Prefix: ${process.env.BL_PREFIX || 'Disabled; using default value: '+c.prefix}

--- Discord.js ---
    Average ping of websocket: ${Math.floor(client.ping * 100) / 100}
    Last ping of websocket: ${client.pings[0]}
    Ready at: ${client.readyAt.toLocaleString()}

--- System Details ---
    CPU Architecture: ${process.arch}
    Platform: ${process.platform}
    Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 * 100) / 100}MB
    Memory Usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100}MB

--- Versions ---
    Node Version: ${process.versions.node}
    HTTP Parser Version: ${process.versions.http_parser}
    v8 Version: ${process.versions.v8}
    Unicode Version: ${process.versions.unicode}
    zlib Version: ${process.versions.zlib}
    OpenSSL Version: ${process.versions.openssl}
`
  return {
    report: data,
    file: `./${type}-reports/${type}-${format}.txt`,
  }
}

module.exports = function(client) {
  let count = 0
  let once = false

  client.on('warn', (warn) => {
    logger.warn(`Got Warning from Client: ${warn}`)
  })

  client.on('disconnect', () => {
    logger.info(`Disconnected from Websocket (${count}ms).`)
    if (count === 0)
      logger.fatal('May wrong your bot token, Is bot token has changed or Base64 encoded?')
        .fatal('Base64 is deprecated since this commit => a0cd0b542a435b7c36b9035e268fdeedd26d4261')
    process.exit()
  })

  client.on('reconnecting', () => {
    logger.fatal('Got Disconnected from Websocket, Reconnecting!')
  })

  process.on('unhandledRejection', async (error = {}) => {
    if (error.name === 'DiscordAPIError') return true // if DiscordAPIError, just ignore it(e.g. Missing Permissions)
    const { report, file } = await makeReport(client, error, 'error')
    client.channels.get('484357084037513216').send(codeblock(report))
      .then(() => logger.info('Error report has been sent!'))
    logger.error(`Unhandled Rejection: ${error}`)
    logger.error(error.stack)
    fs.writeFile(file, report, 'utf8').then(() => {
      logger.info(`Error Report has been writed to ${file}`)
    })
  })

  process.on('uncaughtException', async (error = {}) => {
    const { report, file } = await makeReport(client, error, 'crash')
    require('fs').writeFileSync(file, report, 'utf8')
    require('fs').unlinkSync('./blacklistener.pid') // Backport 41388608acac2d07c3e88a7cdf85cafa87873bc6 (future)
    client.channels.get('484183865976553493').send(codeblock(report))
      .then(() => process.exit(1))
  })

  client.on('rateLimit', (info, method) => {
    logger.fatal('==============================')
      .fatal('      Got rate limiting!      ')
      .fatal(` -> ${info.limit} seconds remaining`)
      .fatal(` Detected rate limit while processing '${method}' method.`)
      .fatal(` Rate limit information: ${JSON.stringify(info)} `)
      .fatal('==============================')
  })

  client.on('guildCreate', () => {
    client.user.setActivity(`${c.prefix}help | ${client.guilds.size} guilds`)
  })

  process.on('SIGINT', () => {
    setInterval(() => {
      if (count <= 5000) {
        ++count
      } else { clearInterval(this) }
    }, 1)
    setTimeout(() => {
      logger.info('Exiting')
      process.exit()
    }, 5000)
    if (count != 0)
      if (!once) {
        logger.info('Caught INT signal')
        logger.info('Removing pid file')
        require('fs').unlinkSync('./blacklistener.pid')
        logger.info('Disconnecting')
        client.destroy()
        once = true
      } else {
        logger.info('Already you tried CTRL+C. Program will exit at time out(' + (5000 - count) / 1000 + ' seconds left) or disconnected')
      }
  })
}

logger.info('Registered all events.')