const { Logger } = require("./LoggerUtil.js")
const { SQLiteUtil } = require("./SQLiteUtil.js")
const fetchAll = require('discord-fetch-all');

class MessageUtil {
    constructor() {
        this.removeIllegalCharacters = (message) => { return message.replace(/[`"']/g, "").replace("\n", " ") }

        this.UserLogMessage = (message) => {
            SQLiteUtil.CreateMessage(message)
        }
    }

    IsChannelPrivate = (channel) => {
        return !channel.permissionsFor(channel.guild.roles.everyone).serialize().ViewChannel
    }

    // TODO: Refactor with the knowledge that messages have a built-in clean content member
    LogMessage = (output, guild, author, message) => {
        var cleanContent = `${this.removeIllegalCharacters(message.cleanContent)}`
        if (cleanContent != "" && cleanContent.trim() != "") {
            if (output) { Logger.quiet(`(GID:${guild.id}, UID:${author.id}) ${author.username}: "${cleanContent}"`) }
            if (message.embeds.length == 0) {
                this.UserLogMessage(message)
            }
        }
        if (message.attachments.size > 0) {
            if (output) { Logger.quiet(`(GID:${guild.id}, UID:${author.id}) ${author.username} sent ${message.attachments.size} attachments`) }
        }
        if (message.embeds.length > 0) {
            if (output) { Logger.quiet(`(GID:${guild.id}, UID:${author.id}) ${author.username} sent ${message.embeds.length} embedded links`) }
        }
    }
}

module.exports.MessageUtil = new MessageUtil()