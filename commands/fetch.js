const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageUtil } = require("../util/MessageUtil.js")
const { SQLiteUtil } = require("../util/SQLiteUtil.js")
const { Logger } = require("../util/LoggerUtil.js")
const { Owner } = require("../config.json")
const fetchAll = require("discord-fetch-all")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fetch")
        .setDescription("FETCH ME THEIR SOULS")
        .addStringOption(option =>
            option.setName("channel-id")
                .setDescription("Specify a channel to fetch from"))
        .addBooleanOption(option =>
            option.setName("include-private")
                .setDescription("Include private channels?"))
    ,

    // TODO: create timeframe option?
    async execute(interaction, client) {
        
        if (interaction.user.id != Owner) {
            await interaction.reply("I'm afraid I can't let you do that.")
        }
        else {
            const specificChannel = interaction.options.getString("channel-id")
            const includePrivate = interaction.options.getBoolean("include-private")
            var channels = client.channels.cache

            if (specificChannel) {
                channels = channels.filter(channel => channel.id == specificChannel || channel.name == specificChannel)
            }

            if (!includePrivate) {
                channels = channels.filter(channel => !MessageUtil.IsChannelPrivate(channel))
            }

            if (channels.size == 0) {
                await interaction.reply(`${includePrivate ? "No" : "No public"} channels were found${specificChannel ? ` with the name ${specificChannel}.` : "."}`)
                return
            }

            var replyMessage = `Located ${channels.size} ${includePrivate ? "" : "public "}channel(s). Attempting to save text channels to the database...`
            Logger.info(replyMessage)
            await interaction.reply(replyMessage)

            const promise = new Promise((resolve, reject) => {
                var successes = 0
                var failures = 0
                channels.each((channel) => {
                    if (channel.isTextBased()) {
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