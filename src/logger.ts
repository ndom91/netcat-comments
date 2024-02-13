import chalk from "chalk"

export const loggerLevels = {
  "LOG": 0,
  "WARN": 1,
  "ERROR": 2,
  "DEBUG": 3
} as const

export const loggerLevelColors = {
  "LOG": "whiteBright",
  "WARN": "yellowBright",
  "ERROR": "redBright",
  "DEBUG": "blueBright",
} as const

type LoggerLevel = typeof loggerLevels[keyof typeof loggerLevels]

export class Logger {
  #logLevel: LoggerLevel = loggerLevels.LOG
  #prefix: string = chalk.dim("COMM")

  constructor({ level, prefix }: { level: LoggerLevel, prefix: string }) {
    this.#logLevel = level
    this.#prefix = prefix
  }

  printf(level: keyof typeof loggerLevels, ...msg: string[]) {
    const coloredLevelString = chalk[loggerLevelColors[level]](level.toUpperCase())
    const method = level.toLowerCase() as Lowercase<keyof typeof loggerLevels>

    console[method](`> ${coloredLevelString} [${chalk.dim(this.#prefix)}]: ${msg.join(" ")}`)
  }

  log(...msg: string[]) {
    if (this.#logLevel >= loggerLevels.LOG) {
      this.printf("LOG", ...msg)
    }
  }
  warn(...msg: string[]) {
    if (this.#logLevel >= loggerLevels.WARN) {
      this.printf("WARN", ...msg)
    }
  }
  error(...msg: string[]) {
    if (this.#logLevel >= loggerLevels.ERROR) {
      this.printf("ERROR", ...msg)
    }
  }
  debug(...msg: string[]) {
    if (this.#logLevel >= loggerLevels.DEBUG) {
      this.printf("DEBUG", ...msg)
    }
  }
  setLevel(level: typeof loggerLevels[keyof typeof loggerLevels]) {
    this.#logLevel = level
  }
}
