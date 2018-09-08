const f = require('string-format')
const Discord = require('discord.js')
const logger = require('../logger').getLogger('commands:lookup', 'purple')
const util = require('../util')

module.exports.args = '<User>'

module.exports.name = 'lookup'

module.exports.run = async function(msg, settings, lang) {
  const args = msg.content.replace(settings.prefix, '').split(' ')
  const client = msg.client
  let id; let force = false
  if (msg.mentions.users.first()) {
    id = msg.mentions.users.first().id
  } else {
    if (args[2] === '--force') { force = true; id = lang.sunknown }
    if (!force) {
      if (/\D/gm.test(args[1])) {
        try {
          id = client.users.find('username', args[1]).id
        } catch (e) {
          try {
            id = msg.guild.members.find('nickname', args[1]).id
          } catch (e) {
            logger.error(e)
            return msg.channel.send(f(lang.unknown, args[1]))
          }
        }
      } else if (/\d{18}/.test(args[1])) {
        let ok = false
        try {
          id = client.users.get(args[1]).id
          ok = true
        } catch (e) {
          try {
            if (!ok) {
              id = client.users.find('username', args[1]).id
              ok = true
            }
          } catch (e) {
            try {
              if (!ok) id = msg.guild.members.find('nickname', args[1]).id
            } catch (e) {
              msg.channel.send(f(lang.unknown, args[1]))
              return logger.error(e)
            }
          }
        }
      } else {
        try {
          id = client.users.find('username', args[1]).id
        } catch (e) {
          try {
            id = msg.guild.members.find('nickname', args[1]).id
          } catch (e) {
            logger.error(e)
            return msg.channel.send(f(lang.unknown, args[1]))
          }
        }
      }
    }
  }
  let userConfig
  let user2
  try {
    userConfig = await util.readJSON(`./data/users/${id}/config.json`)
    user2 = client.users.get(id)
  } catch (e) {
    logger.error(e)
    return msg.channel.send(f(lang.unknown, args[1]))
  }
  const bannedFromServer = userConfig.bannedFromServer.map((server, i) => `${server} (${userConfig.bannedFromServerOwner[i]})`)
  const usernameChanges = userConfig.username_changes.filter(e => e)
  let isBot = lang.no
  if (!force) { if (user2.bot) isBot = lang.yes } else { isBot = lang.sunknown }
  const desc = force ? lang.lookup.desc + ' ・ ' + f(lang.unknown, args[1]) : lang.lookup.desc
  const nick = msg.guild.members.get(user2.id) ? msg.guild.members.get(user2.id).nickname : lang.nul
  const joinedAt = msg.guild.members.get(user2.id) ? msg.guild.members.get(user2.id).joinedAt : lang.sunknown
  const embed = new Discord.RichEmbed()
    .setTitle(lang.lookup.title)
    .setColor([0,255,0])
    .setFooter(desc)
    .setThumbnail(user2.avatarURL)
    .addField(lang.lookup.rep, userConfig.rep)
    .addField(lang.lookup.bannedFromServer, bannedFromServer.join('\n') || lang.lookup.not_banned)
    .addField(lang.lookup.bannedFromUser, userConfig.bannedFromUser.join('\n') || lang.lookup.not_banned)
    .addField(lang.lookup.probes, userConfig.probes.join('\n') || lang.lookup.not_banned)
    .addField(lang.lookup.reasons, userConfig.reasons.join('\n') || lang.lookup.not_banned)
    .addField(lang.lookup.tag, user2.tag)
    .addField(lang.lookup.nickname, nick)
    .addField(lang.lookup.id, user2.id)
    .addField(lang.lookup.username_changes, usernameChanges.join('\n') || lang.no)
    .addField(lang.lookup.bot, isBot)
    .addField(lang.lookup.createdAt, user2.createdAt.toLocaleString())
    .addField(lang.lookup.joinedAt, joinedAt.toLocaleString())
    .addField(lang.lookup.nowTime, new Date().toLocaleString())
  msg.channel.send(embed)
}