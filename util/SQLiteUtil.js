const { Logger } = require("./LoggerUtil.js")
const sqlite3 = require("sqlite3").verbose()
const fs = require("fs")
const _ = require("lodash")

class SQLiteUtil {
    constructor() {
        this.UserDB = new sqlite3.Database("./database/UserDB.db", sqlite3.OPEN_READWRITE, (error) => {
            if (error) { 
                Logger.error("Unable to Connect to UserDB!")
                Logger.error(error)
            }
        })

        this.GetSQL = (queryName) => {
            return fs.readFileSync(`./sql/${queryName}.sql`, "utf8")
        }

        this.InitializeUserDB = (client) => {
            Logger.info("Attempting to Initialize UserDB...")
            try {
                /* Create UserDB's Tables */
                this.UserDB.run(this.GetSQL("CreateUserTable"))
                this.UserDB.run(this.GetSQL("CreateGuildTable"))
                this.UserDB.run(this.GetSQL("CreateMessageTable"))
                /* Create UserDB's Linking Tables */
                this.UserDB.run(this.GetSQL("CreateUserGuildTable"))
                this.UserDB.run(this.GetSQL("CreateUserGuildMessageTable"))
                Logger.success("Successfully Initialized UserDB!")
                /* Populate UserDB Tables */
                const ClientGuilds = client.guilds.cache
                Logger.quiet(`Found ${ClientGuilds.size} Guilds`)
                ClientGuilds.each((guild) => {
                    const GuildUsers = guild.members.cache
                    Logger.quiet(`Found GID:${guild.id} with ${GuildUsers.size} Users`)
                    GuildUsers.each((member) => {
                        this.ValidateGuildAndUser(guild, member.user)
                    })
                })
            } catch(error) {
                Logger.error("Unable to Initialize UserDB!")
                Logger.error(error)
            }
        }
    }

    IsUserDBInitialized = (client) => {
        /* Attempt to Query UserDB */
        this.UserDB.all("SELECT NAME FROM SQLITE_MASTER", [], (error, rows) => {
            if (error) {
                Logger.error("Unable to Query UserDB!")
                Logger.error(error)
            } else {
                if (rows && rows.length == 0) {
                    Logger.warn("No Tables Found in UserDB")
                    this.InitializeUserDB(client)
                } else {
                    Logger.success(`${rows.length} Tables Found in UserDB`)
                }
            }
        })
    }

    /* SELECT QUERIES */
    Select = async (sql, parameters) => {
        var queryResults = null
        await new Promise((resolve, reject) => {
            this.UserDB.serialize(() => {
                this.UserDB.get(sql, parameters, (error, rows) => {
                    if (error) {
                        reject(error)
                    }
                    resolve(rows)
                })
            })
        }).then(
            (result) => {
                queryResults = result ? result : null
            },
            (error) => {
                Logger.warn(error)
            }
        )
        return queryResults
    }

    SelectAll = async (sql, parameters) => {
        var queryResults = null
        await new Promise((resolve, reject) => {
            this.UserDB.serialize(() => {
                this.UserDB.all(sql, parameters, (error, rows) => {
                    if (error) {
                        reject(error)
                    }
                    resolve(rows)
                })
            })
        }).then(
            (result) => {
                queryResults = result ? result : null
            },
            (error) => {
                Logger.warn(error)
            }
        )
        return queryResults
    }

    SelectGuild = async (guild) => {
        var queryResults = await this.Select("SELECT * FROM GUILD WHERE GUILD_ID = ?", [guild.id])
        return queryResults
    }

    SelectAllGuilds = async () => {
        var queryResults = await this.SelectAll("SELECT * FROM GUILD", [])
        return queryResults
    }

    SelectUser = async (user) => {
        var queryResults = await this.Select("SELECT * FROM USER WHERE USER_ID = ?", [user.id])
        return queryResults
    }

    SelectGuildUser = async (guild, user) => {
        var queryResults = await this.Select("SELECT * FROM GUILDUSER WHERE GUILD_ID = ? AND USER_ID = ?", [guild.id, user.id])
        return queryResults
    }

    SelectMessage = async (message) => {
        var queryResults = await this.Select("SELECT * FROM MESSAGE WHERE MESSAGE_ID = ?", [message.id])
        return queryResults
    }

    /* INSERT QUERIES */
    CreateGuild = async (guild) => {
        return this.UserDB.run(
            "INSERT INTO GUILD (GUILD_ID, GUILD_NAME) VALUES (?, ?)", [guild.id, guild.name], (error) => {
                if (error) { return Logger.warn(error) }
                Logger.success(`Created Guild with ID ${guild.id}`)
            }
        )
    }

    CreateUser = async (user) => {
        return this.UserDB.run(
            "INSERT INTO USER (USER_ID, USER_NAME) VALUES (?, ?)", [user.id, user.username], (error) => {
                if (error) { return Logger.warn(error) }
                Logger.success(`Created User with ID ${user.id}`)
            }
        )
    }

    CreateGuildUser = async (guild, user) => {
        return this.UserDB.run(
            "INSERT INTO GUILDUSER (GUILD_ID, USER_ID) VALUES (?, ?)", [guild.id, user.id], (error) => {
                if (error) { return Logger.warn(error) }
                Logger.success(`Created GuildUser with GID:${guild.id} UID:${user.id}`)
            }
        )
    }

    CreateMessage = async (message) => {
        this.UserDB.run(
            "INSERT INTO MESSAGE (MESSAGE_ID, MESSAGE_CREATED_AT, MESSAGE_CONTENT) VALUES (?, ?, ?)", 
            [message.id, message.createdAt, message.cleanContent.replace("`", "")],
            (error) => { if (error) { Logger.warn(error) }})
        this.UserDB.run(
            "INSERT INTO USERGUILDMESSAGE (USER_ID, GUILD_ID, MESSAGE_ID) VALUES (?, ?, ?)", 
            [message.author.id, message.guild.id, message.id],
            (error) => {if (error) { Logger.warn(error) }})
    }

    /* GENERAL QUERIES */
    ValidateGuildAndUser = async (guild, user) => {
        var GuildData = await this.SelectGuild(guild)
        if (!GuildData) {
            await this.CreateGuild(guild).then(() => {GuildData = this.SelectGuild(guild)})
        }
        var UserData = await this.SelectUser(user)
        if (!UserData) {
            await this.CreateUser(user).then(() => {UserData = this.SelectGuild(user)})
        }
        var GuildUserData = await this.SelectGuildUser(guild, user)
        if (!GuildUserData) {
            await this.CreateGuildUser(guild, user).then(() => {GuildUserData = this.SelectGuildUser(guild, user)})
        }
        return [GuildData, UserData, GuildUserData]
    }
}

module.exports.SQLiteUtil = new SQLiteUtil()