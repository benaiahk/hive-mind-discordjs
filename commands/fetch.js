const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageUtil } = require("../util/MessageUtil.js")
const { SQLiteUtil } = require("../util/SQLiteUtil.js")
const { Logger } = require("../util/LoggerUtil.js")
const { Owner } = require("../config.json")
const fetchAll = require('discord-fetch-all')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fetch")
        .setDescription("FETCH ME THEIR SOULS")
    ,

    // TODO: Create command options to exclude private channels, choose specific channels, include a timeframe
    async execute(interaction, client) {
        if (interaction.user.id != Owner) {
            await interaction.reply("I'm afraid I can't let you do that.")
        }
        else {
            const channels = client.channels.cache
            Logger.info(`Located ${channels.size} channels. Attempting to save text channels to the database...`)
            await interaction.reply(`Located ${channels.size} channels. Attempting to save text channels to the database...`)

            const promise = new Promise((resolve, reject) => {
                var successes = 0
                var failures = 0
                channels.each((channel) => {
                    if (channel.type == 0) {
                        try {
                            const channelMessages = fetchAll.messages(channel, {
                                reverseArray: true,
                                userOnly: true,
                                botOnly: false,
                                pinnedOnly: false,
                            })
    
                            channelMessages.then((result) => {
                                Logger.quiet(`Text Channel Found: ${channel.name}, Saving ${result.length} Messages...`)
                                result.forEach((message) => {
                                    try {
                                        const GuildUserIds = SQLiteUtil.ValidateGuildAndUser(message.guild, message.author)
                                        MessageUtil.LogMessage(false, message.guild, message.author, message)
                                        successes++
                                    } catch (error) {
                                        failures++
                                    }
                                })
                            })
                        } catch (error) {
                            Logger.error(`Failed to save "${channel.name}" (CID:${channel.id})`)
                            Logger.error(error)
                        }
                    }
                })
                resolve(`Successfully Saved ${successes} Messages and Failed to Save ${failures} Messages.`)
            })

            promise.then(
                (resolve) => {
                    Logger.success(resolve)
                },
                (reject) => {
                    Logger.error(reject)
                }
            )
        }
    }
}