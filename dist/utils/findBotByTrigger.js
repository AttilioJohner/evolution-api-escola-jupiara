"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBotByTrigger = void 0;
const advancedOperatorsSearch_1 = require("./advancedOperatorsSearch");
const findBotByTrigger = async (botRepository, content, instanceId) => {
    const findTriggerAllOrNone = await botRepository.findFirst({
        where: {
            enabled: true,
            triggerType: {
                in: ['all', 'none'],
            },
            instanceId: instanceId,
        },
    });
    if (findTriggerAllOrNone) {
        return findTriggerAllOrNone;
    }
    const findTriggerAdvanced = await botRepository.findMany({
        where: {
            enabled: true,
            triggerType: 'advanced',
            instanceId: instanceId,
        },
    });
    for (const advanced of findTriggerAdvanced) {
        if ((0, advancedOperatorsSearch_1.advancedOperatorsSearch)(content, advanced.triggerValue)) {
            return advanced;
        }
    }
    const findTriggerEquals = await botRepository.findFirst({
        where: {
            enabled: true,
            triggerType: 'keyword',
            triggerOperator: 'equals',
            triggerValue: content,
            instanceId: instanceId,
        },
    });
    if (findTriggerEquals) {
        return findTriggerEquals;
    }
    const findRegex = await botRepository.findMany({
        where: {
            enabled: true,
            triggerType: 'keyword',
            triggerOperator: 'regex',
            instanceId: instanceId,
        },
    });
    let findTriggerRegex = null;
    for (const regex of findRegex) {
        const regexValue = new RegExp(regex.triggerValue);
        if (regexValue.test(content)) {
            findTriggerRegex = regex;
            break;
        }
    }
    if (findTriggerRegex)
        return findTriggerRegex;
    const findStartsWith = await botRepository.findMany({
        where: {
            enabled: true,
            triggerType: 'keyword',
            triggerOperator: 'startsWith',
            instanceId: instanceId,
        },
    });
    let findTriggerStartsWith = null;
    for (const startsWith of findStartsWith) {
        if (content.startsWith(startsWith.triggerValue)) {
            findTriggerStartsWith = startsWith;
            break;
        }
    }
    if (findTriggerStartsWith)
        return findTriggerStartsWith;
    const findEndsWith = await botRepository.findMany({
        where: {
            enabled: true,
            triggerType: 'keyword',
            triggerOperator: 'endsWith',
            instanceId: instanceId,
        },
    });
    let findTriggerEndsWith = null;
    for (const endsWith of findEndsWith) {
        if (content.endsWith(endsWith.triggerValue)) {
            findTriggerEndsWith = endsWith;
            break;
        }
    }
    if (findTriggerEndsWith)
        return findTriggerEndsWith;
    const findContains = await botRepository.findMany({
        where: {
            enabled: true,
            triggerType: 'keyword',
            triggerOperator: 'contains',
            instanceId: instanceId,
        },
    });
    let findTriggerContains = null;
    for (const contains of findContains) {
        if (content.includes(contains.triggerValue)) {
            findTriggerContains = contains;
            break;
        }
    }
    if (findTriggerContains)
        return findTriggerContains;
    return null;
};
exports.findBotByTrigger = findBotByTrigger;
