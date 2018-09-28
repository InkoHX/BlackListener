const logger = require('../logger').getLogger('commands:shutdown', 'darkgray')
const f = require('string-format')

module.exports.args = ['[-f]', '[-r]']

module.exports.name = 'shutdown'

module.exports.isAllowed = (msg, owners) => {
  return owners.includes(msg.author.id)
}

module.exports.run = async function(msg, settings, lang) {
  const args = msg.content.replace(settings.prefix, '').split(' ')
  const client = msg.client
  if (~args.indexOf('-f')) {
    if (/-(g|)f(g|)/gm.test(args[1])) await msg.channel.send(':warning: Can\'t use graceful parameter; already set force option.')
    logger.warn(f(lang.atmpfs, msg.author.tag))
    await msg.channel.send(lang.bye)
    process.exit(0)
  } else if (/-(g|)r/gm.test(args[1])) {
    logger.info(f(lang.rebooting))
    await msg.channel.send(lang.rebooting)
    if (!/-(g|)r(g|)/gm.test(args[1])) return process.kill(process.pid, 'SIGKILL')
    process.send('stop')
  } else {
    logger.info(f(lang.success, msg.content))
    msg.channel.send(lang.bye)
    if (!/-g/.test(args[1])) return client.destroy()
    process.send('stop')
  }
}
