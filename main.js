const { MessageUtil } = require("./util/MessageUtil.js")
const { SQLiteUtil } = require("./util/SQLiteUtil.js")
const { Logger } = require("./util/LoggerUtil.js")
const { Token } = require("./config.json")
const { REST, Routes, Client, Collection } = require("discord.js")
const { readdirSync } = require("fs")
const cron = require("node-cron")

const client = new Client({ "intents": 3248127 })
client.commands = new Collection()

client.on("ready", async () => {
    Logger.success(`${client.user.username} Is Now Online!`)
    Logger.success(`[${client.guilds.cache.size} Guilds] - [${client.channels.cache.size} Channels] - [${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()} Users]`)

    /* Initialize UserDB if not found */
    // TODO: Move this into two separate methods (one to check, one to initialize)
    // TODO: Create UserDB.db file if not found initially
    SQLiteUtil.IsUserDBInitialized(client)

    /* REGISTER SLASH COMMANDS */
    const CommandFiles = readdirSync("./commands").filter(file => file.endsWith(".js"))
    const Commands = []
    const rest = new REST({ version: "10" }).setToken(Token)
    for (const file of CommandFiles) {
        const command = require(`./commands/${file}`)
        Commands.push(command.data.toJSON())
        client.commands.set(command.data.name, command)
    }    
    try {
        Logger.info("Refreshing Application (/) Commands...")
        await rest.put(Routes.applicationCommands(client.user.id), { body: Commands })
        Logger.success(`${Commands.length} Slash Commands Succesfully Registered Globally!`)
    } catch (error) {
        console.error(error)
    }

    /* DAILY MESSAGE */
    // TODO: Move to own service or util
    cron.schedule("0 8 * * * *", function() {
        SQLiteUtil.Select(
            "SELECT M.MESSAGE_CONTENT MESSAGE_CONTENT, U.USER_NAME USER_NAME FROM MESSAGE M INNER JOIN USERGUILDMESSAGE UGM ON UGM.MESSAGE_ID = M.MESSAGE_ID INNER JOIN USER U ON U.USER_ID = UGM.USER_ID ORDER BY RANDOM()", []).then((result) => {
            if (result && result.MESSAGE_CONTENT && result.USER_NAME) {
                Logger.info(`**${result.USER_NAME}:** ${result.MESSAGE_CONTENT}`)
            } else {
                Logger.error("Unable to grab random message.")
            }
        })
    });
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    /* Make sure interaction user is found in GUILD & USER tables */
    const GuildUserIds = await SQLiteUtil.ValidateGuildAndUser(interaction.guild, interaction.user)
    command.execute(interaction, client)
})

client.on('messageCreate', async message => {
    if (message.author.bot) return

    /* Make sure message author is found in GUILD & USER tables */
    const GuildUserIds = await SQLiteUtil.ValidateGuildAndUser(message.guild, message.author)
    MessageUtil.LogMessage(true, message.guild, message.author, message)
})

process.on("exit", () => {
    Logger.error(`Bot Instance Exited, ${client.user.username} Is Now Offline!`)
})

client.login(Token)