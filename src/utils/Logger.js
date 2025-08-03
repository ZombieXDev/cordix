const chalk = require("chalk").default;
let debugEnabled = false;

const Logger = {
  setDebug(enabled) {
    debugEnabled = enabled;
  },
  info: (...args) => {
    if (!debugEnabled) return;
    console.log(chalk.blue("[INFO]"), ...args);
  },
  warn: (...args) => {
    if (!debugEnabled) return;
    console.warn(chalk.yellow("[WARN]"), ...args);
  },
  error: (...args) => {
    if (!debugEnabled) return;
    console.error(chalk.red("[ERROR]"), ...args);
  },
  debug: (...args) => {
    if (!debugEnabled) return;
    console.log(chalk.gray("[DEBUG]"), ...args);
  },
};

module.exports = Logger;
