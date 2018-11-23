const Converter = require(__dirname + '/../converter.js')
const f = require('string-format')
const { Command } = require('klasa')

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'setignore',
      args: [
        '<Channel>',
      ],
      permissionLevel: 6,
    })
  }

  run(msg, settings, lang, args) {
    const channel = Converter.toTextChannel(msg, args[1])
    if (!channel) return msg.channel.send(lang._invalid_args)
    const id = channel.id
    settings.excludeLogging = id
    msg.channel.send(f(lang._setconfig, 'excludeLogging'))
  }
}