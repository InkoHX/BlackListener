const { toUser } = require(__dirname + '/../converter.js')
const { Command } = require('../core')

module.exports = class extends Command {
  constructor() {
    const opts = {
      args: [
        '<User>',
      ],
      permission: 8,
    }
    super('instantkick', opts)
  }

  run(msg, settings, lang) {
    const args = msg.content.replace(settings.prefix, '').split(' ')
    if (!args[1]) return msg.channel.send(lang.invalid_args)
    const user = toUser(msg, args[1])
    msg.guild.members.get(user.id).kick('Instant Kick by BlackListener by ' + msg.author.tag)
    msg.channel.send(':ok_hand:')
  }
}
