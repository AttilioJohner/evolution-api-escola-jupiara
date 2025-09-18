"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveOnWhatsappCache = saveOnWhatsappCache;
exports.getOnWhatsappCache = getOnWhatsappCache;
const server_module_1 = require("@api/server.module");
const env_config_1 = require("@config/env.config");
const dayjs_1 = __importDefault(require("dayjs"));
function getAvailableNumbers(remoteJid) {
    const numbersAvailable = [];
    if (remoteJid.startsWith('+')) {
        remoteJid = remoteJid.slice(1);
    }
    const [number, domain] = remoteJid.split('@');
    if (remoteJid.startsWith('55')) {
        const numberWithDigit = number.slice(4, 5) === '9' && number.length === 13 ? number : `${number.slice(0, 4)}9${number.slice(4)}`;
        const numberWithoutDigit = number.length === 12 ? number : number.slice(0, 4) + number.slice(5);
        numbersAvailable.push(numberWithDigit);
        numbersAvailable.push(numberWithoutDigit);
    }
    else if (number.startsWith('52') || number.startsWith('54')) {
        let prefix = '';
        if (number.startsWith('52')) {
            prefix = '1';
        }
        if (number.startsWith('54')) {
            prefix = '9';
        }
        const numberWithDigit = number.slice(2, 3) === prefix && number.length === 13
            ? number
            : `${number.slice(0, 2)}${prefix}${number.slice(2)}`;
        const numberWithoutDigit = number.length === 12 ? number : number.slice(0, 2) + number.slice(3);
        numbersAvailable.push(numberWithDigit);
        numbersAvailable.push(numberWithoutDigit);
    }
    else {
        numbersAvailable.push(remoteJid);
    }
    return numbersAvailable.map((number) => `${number}@${domain}`);
}
async function saveOnWhatsappCache(data) {
    if (env_config_1.configService.get('DATABASE').SAVE_DATA.IS_ON_WHATSAPP) {
        const upsertsQuery = data.map((item) => {
            const remoteJid = item.remoteJid.startsWith('+') ? item.remoteJid.slice(1) : item.remoteJid;
            const numbersAvailable = getAvailableNumbers(remoteJid);
            return server_module_1.prismaRepository.isOnWhatsapp.upsert({
                create: {
                    remoteJid: remoteJid,
                    jidOptions: numbersAvailable.join(','),
                    lid: item.lid,
                },
                update: {
                    jidOptions: numbersAvailable.join(','),
                    lid: item.lid,
                },
                where: { remoteJid: remoteJid },
            });
        });
        await server_module_1.prismaRepository.$transaction(upsertsQuery);
    }
}
async function getOnWhatsappCache(remoteJids) {
    let results = [];
    if (env_config_1.configService.get('DATABASE').SAVE_DATA.IS_ON_WHATSAPP) {
        const remoteJidsWithoutPlus = remoteJids.map((remoteJid) => getAvailableNumbers(remoteJid)).flat();
        const onWhatsappCache = await server_module_1.prismaRepository.isOnWhatsapp.findMany({
            where: {
                OR: remoteJidsWithoutPlus.map((remoteJid) => ({ jidOptions: { contains: remoteJid } })),
                updatedAt: {
                    gte: (0, dayjs_1.default)().subtract(env_config_1.configService.get('DATABASE').SAVE_DATA.IS_ON_WHATSAPP_DAYS, 'days').toDate(),
                },
            },
        });
        results = onWhatsappCache.map((item) => ({
            remoteJid: item.remoteJid,
            number: item.remoteJid.split('@')[0],
            jidOptions: item.jidOptions.split(','),
            lid: item.lid,
        }));
    }
    return results;
}
