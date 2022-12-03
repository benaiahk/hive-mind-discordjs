const { Logger } = require("./LoggerUtil.js")
const { SQLiteUtil } = require("./SQLiteUtil.js")
const fetchAll = require('discord-fetch-all');
const fs = require("fs")

class MessageUtil {
    constructor() {
        this.removeIllegalCharacters = (message) => { return message.replace(/[`"']/g, "").replace("\n", " ") }

        this.UserLogMessage = (message) => {
            SQLiteUtil.CreateMessage(message)
        }
    }

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

    LogAllMessages = async (client) => {
        var allGuilds = []
        var allGuildEntries = await SQLiteUtil.SelectAllGuilds()
        allGuildEntries.forEach((row) => {
            console.log(row.GUILD_ID)
            console.log(client.guilds.cache.get(row.GUILD_ID))
        })
    }
}

module.exports.MessageUtil = new MessageUtil()