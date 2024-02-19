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
  #prefix: string

  constructor({ level, prefix }: { level: LoggerLevel, prefix?: string }) {
    this.#logLevel = level
    this.#prefix = chalk.dim(prefix ?? "COMM")
  }

  printf(level: keyof typeof loggerLevels, ...msgs: string[]) {
    const coloredLevelString = chalk[loggerLevelColors[level]](level.toUpperCase())
    const method = level.toLowerCase() as Lowercase<keyof typeof loggerLevels>

    // Allow passing objects to log
    let outputMsg = []
    for (const msg of msgs) {
      if (typeof msg === "object") {
        outputMsg.push(JSON.stringify(msg, null, 2))
      } else if (typeof msg === 'string') {
        outputMsg.push(msg)
      }
    }

    console[method === 'debug' ? 'log' : method](`> ${coloredLevelString} [${chalk.dim(this.#prefix)}]: ${outputMsg.join(" ")}`)
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
