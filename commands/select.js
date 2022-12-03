const { SlashCommandBuilder } = require("@discordjs/builders");
const { SQLiteUtil } = require("../util/SQLiteUtil.js")
const { Logger } = require("../util/LoggerUtil.js")
const { Owner } = require("../config.json")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("select")
        .setDescription("Runs a SELECT Query")
        .addStringOption(option => 
            option.setName('query')
                .setDescription('SELECT Query')
                .setRequired(true))
    ,

    async execute(interaction, client) {
        if (interaction.user.id != Owner) {
            await interaction.reply("I'm afraid I can't let you do that.");
        }
        else {
            try {
                const query = interaction.options.getString('query')
                Logger.info(`${interaction.user.username} running query: ${query}`)
                if (query) {
                    var queryResultsArr = []
                    var queryResults = await SQLiteUtil.SelectAll(query, [])
                    if (queryResults) {
                        queryResults.forEach((row) => {
                            queryResultsArr.push(
                                Object.values(row).join(" - ")
                            )
                        })
                        var formattedResults = queryResultsArr.join("\n")
                        if (formattedResults.trim() != "") {
                            if (formattedResults.length > 2000) {
                                formattedResults = formattedResults.substring(0, 1996) + "..."
                            }
                            Logger.quiet(`${query} Returned:\n${formattedResults}`)
                            await interaction.reply(formattedResults)
                        } else {
                            Logger.quiet(`${query} Returned Nothing`)
                            await interaction.reply("No Results Returned")
                        }
                    } else {
                        Logger.quiet(`${query} Returned Nothing`)
                        await interaction.reply("No Results Returned")
                    }
                } else {
                    await interaction.reply("No Query Provided")
                }
            } catch(error) {
                Logger.error(error)
                await interaction.reply("Unexpected Exception Encountered. See logs for details.")
            }
        }
    }
};