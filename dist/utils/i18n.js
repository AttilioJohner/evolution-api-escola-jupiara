"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = require("@config/env.config");
const fs_1 = __importDefault(require("fs"));
const i18next_1 = __importDefault(require("i18next"));
const path_1 = __importDefault(require("path"));
const languages = ['en', 'pt-BR', 'es'];
const translationsPath = path_1.default.join(__dirname, 'translations');
const configService = new env_config_1.ConfigService();
const resources = {};
languages.forEach((language) => {
    const languagePath = path_1.default.join(translationsPath, `${language}.json`);
    if (fs_1.default.existsSync(languagePath)) {
        resources[language] = {
            translation: require(languagePath),
        };
    }
});
i18next_1.default.init({
    resources,
    fallbackLng: 'en',
    lng: configService.get('LANGUAGE'),
    debug: false,
    interpolation: {
        escapeValue: false,
    },
});
exports.default = i18next_1.default;
