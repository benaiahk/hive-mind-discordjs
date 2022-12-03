const moment = require("moment")
const fs = require("fs")

class LoggerUtil {
    constructor() {
        this.FILE_STREAM = fs.createWriteStream(
            "./logs/catalina.log", 
            {flags: "a"}
        )

        this.DATE_FORMAT = "YYYY-MM-DD, HH:mm:ss"

        this.COLOR_RED    = "\u001b[1;31m"
        this.COLOR_PINK   = "\u001b[1;35m"
        this.COLOR_TEAL   = "\u001b[1;36m"
        this.COLOR_BLUE   = "\u001b[1;34m"
        this.COLOR_GRAY   = "\u001b[1;30m"
        this.COLOR_YELLOW = "\u001b[1;33m"
        this.COLOR_GREEN  = "\u001b[1;32m"
        this.COLOR_WHITE  = "\u001b[1;37m"

        this.GetCurrentTime = (format) => {
            return moment(Date.now()).format(format);
        };

        this.LogMessage = (message, color) => {
            console.log(`${color}[${this.GetCurrentTime(this.DATE_FORMAT)}] ${color}${message}`)
            this.WriteToLogs(message)
        }

        this.WriteToLogs = (message) => {
            this.FILE_STREAM.write(`[${this.GetCurrentTime(this.DATE_FORMAT)}] ${message}\n`)
        }
    }

    info    = (message) => {this.LogMessage(message, this.COLOR_WHITE)}
    warn    = (message) => {this.LogMessage(message, this.COLOR_YELLOW)}
    error   = (message) => {this.LogMessage(`*ERROR* ${message}`, this.COLOR_RED)}
    success = (message) => {this.LogMessage(message, this.COLOR_GREEN)}
    quiet   = (message) => {this.LogMessage(message, this.COLOR_GRAY)}
}

module.exports.Logger = new LoggerUtil()