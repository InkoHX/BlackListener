require('./yaml')
const fs = require('fs')
const config = require(__dirname +'/config.yml')
const chalk = require('chalk')
const moment = require('moment')
const args = require(__dirname + '/argument_parser')(process.argv.slice(2))

class Logger {
  /**
   * Do not call this method twice.
   *
   * @returns {Logger} A Logger instance
   */
  initLog() {
    this.initialized = true
    fs.writeFileSync('latest.log', `--- The log begin at ${new Date().toLocaleString()} ---\n`)
    if (config.logger.style === 'maven') {
      this.style = 'maven'
    } else if (config.logger.style === 'npm') {
      this.style = 'npm'
    } else {
      this.style = 'original'
    }
    this.info('The log file has initialized.', true)
    return this
  }

  /**
   * Set thread name and color.
   *
   * @example const logger = require('./logger').getLogger("example", "red")
   * @param {string} thread Thread name
   * @param {string} color Default: Random color, yellow, darkgray, red, lightred, green, lightpurple, white, cyan, purple, blue
   * @returns {Logger} A Logger instance
   */
  getLogger(thread, color = null, init = true) {
    if (!init) { this.initLog = () => {}; this.initialized = true }
    if (!this.initialized && init) this.initLog()
    const self = new Logger()
    self.thread = thread
    self.thread_raw = thread
    if (config.logger.style === 'maven') {
      self.style = 'maven'
    } else {
      self.style = 'original'
    }
    const colors = [
      chalk.bold.yellow(thread),
      chalk.gray(thread),
      chalk.red(thread),
      chalk.bold.red(thread),
      chalk.green(thread),
      chalk.bold.hex('#800080')(thread),
      chalk.white(thread),
      chalk.cyan(thread),
      chalk.hex('#800080')(thread),
      chalk.blue(thread),
    ]
    switch (color) {
      case 'yellow': self.thread = colors[0]; break
      case 'darkgray': self.thread = colors[1]; break
      case 'red': self.thread = colors[2]; break
      case 'lightred': self.thread = colors[3]; break
      case 'green': self.thread = colors[4]; break
      case 'lightpurple': self.thread = colors[5]; break
      case 'white': self.thread = colors[6]; break
      case 'cyan': self.thread = colors[7]; break
      case 'purple': self.thread = colors[8]; break
      case 'blue': self.thread = colors[9]; break
      default: {
        self.thread = colors[Math.floor(Math.random() * colors.length)]
        break
      }
    }
    self.info(`Registered logger for: ${thread}`, true)
    return self
  }
  /**
   *
   * @param {*} message Message of this log
   * @param {string} level error, warn, fatal, info, debug
   * @param {string} color color of chalk
   * @param {boolean} isLogger Is this called by myself?
   * @returns {void} <void>
   * @private
   */
  out(message, level, color, isLogger, write_to_console = true) {
    const date = chalk.cyan(moment().format('YYYY-MM-DD HH:mm:ss.SSS')) + chalk.reset()
    let thread = this.thread
    const logger = {}
    logger.coloredlevel = chalk`{${color} ${level}}`
    if (isLogger) { this.thread_raw = 'logger'; thread = chalk.hex('#800080')(this.thread_raw) }
    let data
    if (this.style === 'maven') {
      level = level.replace('warn', 'warning')
      logger.coloredlevel2 = chalk`{${color}.bold ${level.toUpperCase()}}`
      data = `[${logger.coloredlevel2}${chalk.reset()}] ${message}${chalk.reset()}`
    } else {
      data = `${date} ${thread}${chalk.reset()} ${logger.coloredlevel}${chalk.reset()} ${chalk.green(message)}${chalk.reset()}`
    }
    fs.appendFileSync('latest.log', `${data}\n`)
    if (write_to_console)console.info(data)
  }
  /**
   * Outputs info level message.
   *
   * @example logger.info("foo")
   *
   *
   * @example logger.info("foo").error("bar")
   *
   *
   * @param {*} message
   * @param {boolean} isLogger Don't use this
   *
   * @returns {Logger} A Logger instance
   */
  info(message, isLogger = false) {
    this.out(message, 'info', 'blue', isLogger)
    return this
  }
  /**
   * Outputs debug level message.
   * Just debug message.
   *
   * @example logger.debug("foo")
   *
   *
   * @example logger.debug("foo").error("bar")
   *
   *
   * @param {*} message
   * @param {boolean} isLogger Don't use this
   *
   * @returns {Logger} A Logger instance
   */
  debug(message, isLogger = false) {
    let opt = false
    if (config.logger.debug || args.debugg) {
      if (args.debugg === false) return this
      opt = true
    }
    this.out(message, 'debug', 'cyan', isLogger, opt)
    return this
  }
  /**
   * Outputs warn level message.
   * Warning condition
   *
   * @example logger.warn("foo")
   *
   *
   * @example logger.warn("foo").error("bar")
   *
   *
   * @param {*} message
   * @param {boolean} isLogger Don't use this
   *
   * @returns {Logger} A Logger instance
   */
  warn(message, isLogger = false) {
    this.out(message, 'warn', 'bold.yellow', isLogger)
    return this
  }
  /**
   * Outputs error level message.
   * Error condition
   *
   * @example logger.error("foo")
   *
   *
   * @example logger.error("foo").debug("bar")
   *
   *
   * @param {*} message
   * @param {boolean} isLogger Don't use this
   *
   * @returns {Logger} A Logger instance
   */
  error(message, isLogger = false) {
    this.out(message, 'error', 'red', isLogger)
    return this
  }
  /**
   * Outputs fatal level message.
   * Fatal Error, may need action immediately
   *
   * @example logger.fatal("foo")
   *
   *
   * @example logger.fatal("foo").error("bar")
   *
   *
   * @param {*} message
   * @param {boolean} isLogger Don't use this
   *
   * @returns {Logger} A Logger instance
   */
  fatal(message, isLogger = false) {
    this.out(message, 'fatal', 'redBright.bold', isLogger)
    return this
  }
  /**
   * Outputs emerg level message.
   * Use on going system is unusable(e.g. uncaughtException)
   *
   * @example logger.emerg("foo")
   *
   *
   * @example logger.emerg("foo").emerg("bar")
   *
   *
   * @param {*} message
   *
   * @returns {Logger} A Logger instance
   */
  emerg(message) {
    this.out(message, 'emerg', 'red.bold', false)
    return this
  }
}

process.on('message', message => {
  if (message === 'noinit') Logger.prototype.initLog = () => {}
})

module.exports = new Logger()
