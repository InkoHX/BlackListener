const f = require('string-format')
const logger = require('./logger').getLogger('commands', 'yellow')
const { commands } = require('./commands')
const levenshtein = require('fast-levenshtein').get
const util = require('./util')
const isTravisBuild = process.argv.includes('--travis-build')
const s = isTravisBuild ? require(__dirname + '/travis.yml') : require(__dirname + '/config.yml')

async function runCommand(command, settings, msg, lang) {
  if (!command.enabled) return msg.channel.send(f(lang.disabled_command, command.name))
  if (!command.isAllowed(msg, s.owners)) return msg.channel.send(lang.udonthaveperm)
  logger.info(f(lang.issuedcmd, msg.author.tag, msg.content))
  try {
    await command.run(msg, settings, lang)
  } catch (e) {
    await msg.channel.send(f(lang.error_occurred, command.name))
    logger.info(f(lang.error_occurred, command.name))
    throw e
  }
}

module.exports = async function(settings, msg, lang) {
  if (msg.content === `<@${msg.client.user.id}>` || msg.content === `<@!${msg.client.user.id}>`)
    return msg.channel.send(f(lang.prefixis, settings.prefix))
  if (msg.content.startsWith(settings.prefix)) {
    const [cmd] = msg.content.replace(settings.prefix, '').split(' ')
    if (settings.banned) return msg.channel.send(f(lang.error, lang.errors.server_banned))
    if (commands[cmd]) {
      await runCommand(commands[cmd], settings, msg, lang)
    } else if (await util.exists(`${__dirname}/plugins/commands/${cmd}.js`)) {
      const plugin = require(`${__dirname}/plugins/commands/${cmd}.js`)
      await runCommand(plugin, settings, msg, lang)
    } else {
      const commandList = Object.keys(commands).map(cmd => ({ cmd, args: commands[cmd].args }))
      const similarCommand = commandList.map(item => ({ ...item, no: levenshtein(cmd, item.cmd) }))
      const cmds = similarCommand.sort((a, b) => a.no - b.no).filter(item => item.no <= 2)
      const list = cmds.map(item => `・\`${settings.prefix}${item.cmd} ${item.args || ''}\``)
      msg.channel.send(f(lang.no_command, settings.prefix, cmd))
      if (list.length) msg.channel.send(f(lang.didyoumean, list.join('\n')))
    }
  }
}
