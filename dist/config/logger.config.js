"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const fs_1 = __importDefault(require("fs"));
const env_config_1 = require("./env.config");
const packageJson = JSON.parse(fs_1.default.readFileSync('./package.json', 'utf8'));
const formatDateLog = (timestamp) => (0, dayjs_1.default)(timestamp)
    .toDate()
    .toString()
    .replace(/\sGMT.+/, '');
var Color;
(function (Color) {
    Color["LOG"] = "\u001B[32m";
    Color["INFO"] = "\u001B[34m";
    Color["WARN"] = "\u001B[33m";
    Color["ERROR"] = "\u001B[31m";
    Color["DEBUG"] = "\u001B[36m";
    Color["VERBOSE"] = "\u001B[37m";
    Color["DARK"] = "\u001B[30m";
})(Color || (Color = {}));
var Command;
(function (Command) {
    Command["RESET"] = "\u001B[0m";
    Command["BRIGHT"] = "\u001B[1m";
    Command["UNDERSCORE"] = "\u001B[4m";
})(Command || (Command = {}));
var Level;
(function (Level) {
    Level["LOG"] = "\u001B[32m%s\u001B[0m";
    Level["DARK"] = "\u001B[30m%s\u001B[0m";
    Level["INFO"] = "\u001B[34m%s\u001B[0m";
    Level["WARN"] = "\u001B[33m%s\u001B[0m";
    Level["ERROR"] = "\u001B[31m%s\u001B[0m";
    Level["DEBUG"] = "\u001B[36m%s\u001B[0m";
    Level["VERBOSE"] = "\u001B[37m%s\u001B[0m";
})(Level || (Level = {}));
var Type;
(function (Type) {
    Type["LOG"] = "LOG";
    Type["WARN"] = "WARN";
    Type["INFO"] = "INFO";
    Type["DARK"] = "DARK";
    Type["ERROR"] = "ERROR";
    Type["DEBUG"] = "DEBUG";
    Type["VERBOSE"] = "VERBOSE";
})(Type || (Type = {}));
var Background;
(function (Background) {
    Background["LOG"] = "\u001B[42m";
    Background["INFO"] = "\u001B[44m";
    Background["WARN"] = "\u001B[43m";
    Background["DARK"] = "\u001B[40m";
    Background["ERROR"] = "\u001B[41m";
    Background["DEBUG"] = "\u001B[46m";
    Background["VERBOSE"] = "\u001B[47m";
})(Background || (Background = {}));
class Logger {
    constructor(context = 'Logger') {
        this.configService = env_config_1.configService;
        this.instance = null;
        this.context = context;
    }
    setContext(value) {
        this.context = value;
    }
    setInstance(value) {
        this.instance = value;
    }
    console(value, type) {
        const types = [];
        this.configService.get('LOG').LEVEL.forEach((level) => types.push(Type[level]));
        const typeValue = typeof value;
        if (types.includes(type)) {
            if (env_config_1.configService.get('LOG').COLOR) {
                console.log(Command.BRIGHT + Level[type], '[Evolution API]', Command.BRIGHT + Color[type], this.instance ? `[${this.instance}]` : '', Command.BRIGHT + Color[type], `v${packageJson.version}`, Command.BRIGHT + Color[type], process.pid.toString(), Command.RESET, Command.BRIGHT + Color[type], '-', Command.BRIGHT + Color.VERBOSE, `${formatDateLog(Date.now())}  `, Command.RESET, Color[type] + Background[type] + Command.BRIGHT, `${type} ` + Command.RESET, Color.WARN + Command.BRIGHT, `[${this.context}]` + Command.RESET, Color[type] + Command.BRIGHT, `[${typeValue}]` + Command.RESET, Color[type], typeValue !== 'object' ? value : '', Command.RESET);
                typeValue === 'object' ? console.log(value, '\n') : '';
            }
            else {
                console.log('[Evolution API]', this.instance ? `[${this.instance}]` : '', process.pid.toString(), '-', `${formatDateLog(Date.now())}  `, `${type} `, `[${this.context}]`, `[${typeValue}]`, value);
            }
        }
    }
    log(value) {
        this.console(value, Type.LOG);
    }
    info(value) {
        this.console(value, Type.INFO);
    }
    warn(value) {
        this.console(value, Type.WARN);
    }
    error(value) {
        this.console(value, Type.ERROR);
    }
    verbose(value) {
        this.console(value, Type.VERBOSE);
    }
    debug(value) {
        this.console(value, Type.DEBUG);
    }
    dark(value) {
        this.console(value, Type.DARK);
    }
}
exports.Logger = Logger;
