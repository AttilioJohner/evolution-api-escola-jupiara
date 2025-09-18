"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsController = void 0;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const event_controller_1 = require("../event.controller");
class SqsController extends event_controller_1.EventController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor, env_config_1.configService.get('SQS')?.ENABLED, 'sqs');
        this.logger = new logger_config_1.Logger('SqsController');
    }
    init() {
        if (!this.status) {
            return;
        }
        new Promise((resolve) => {
            const awsConfig = env_config_1.configService.get('SQS');
            this.sqs = new client_sqs_1.SQS({
                credentials: {
                    accessKeyId: awsConfig.ACCESS_KEY_ID,
                    secretAccessKey: awsConfig.SECRET_ACCESS_KEY,
                },
                region: awsConfig.REGION,
            });
            this.logger.info('SQS initialized');
            resolve();
        });
    }
    set channel(sqs) {
        this.sqs = sqs;
    }
    get channel() {
        return this.sqs;
    }
    async set(instanceName, data) {
        if (!this.status) {
            return;
        }
        if (!data[this.name]?.enabled) {
            data[this.name].events = [];
        }
        else {
            if (0 === data[this.name].events.length) {
                data[this.name].events = event_controller_1.EventController.events;
            }
        }
        await this.saveQueues(instanceName, data[this.name].events, data[this.name]?.enabled);
        const payload = {
            where: {
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
            update: {
                enabled: data[this.name]?.enabled,
                events: data[this.name].events,
            },
            create: {
                enabled: data[this.name]?.enabled,
                events: data[this.name].events,
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
        };
        console.log('*** payload: ', payload);
        return this.prisma[this.name].upsert(payload);
    }
    async emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }) {
        if (integration && !integration.includes('sqs')) {
            return;
        }
        if (!this.status) {
            return;
        }
        const instanceSqs = await this.get(instanceName);
        const sqsLocal = instanceSqs?.events;
        const we = event.replace(/[.-]/gm, '_').toUpperCase();
        if (instanceSqs?.enabled) {
            if (this.sqs) {
                if (Array.isArray(sqsLocal) && sqsLocal.includes(we)) {
                    const eventFormatted = `${event.replace('.', '_').toLowerCase()}`;
                    const queueName = `${instanceName}_${eventFormatted}.fifo`;
                    const sqsConfig = env_config_1.configService.get('SQS');
                    const sqsUrl = `https://sqs.${sqsConfig.REGION}.amazonaws.com/${sqsConfig.ACCOUNT_ID}/${queueName}`;
                    const message = {
                        event,
                        instance: instanceName,
                        data,
                        server_url: serverUrl,
                        date_time: dateTime,
                        sender,
                        apikey: apiKey,
                    };
                    const params = {
                        MessageBody: JSON.stringify(message),
                        MessageGroupId: 'evolution',
                        MessageDeduplicationId: `${instanceName}_${eventFormatted}_${Date.now()}`,
                        QueueUrl: sqsUrl,
                    };
                    this.sqs.sendMessage(params, (err) => {
                        if (err) {
                            this.logger.error({
                                local: `${origin}.sendData-SQS`,
                                message: err?.message,
                                hostName: err?.hostname,
                                code: err?.code,
                                stack: err?.stack,
                                name: err?.name,
                                url: queueName,
                                server_url: serverUrl,
                            });
                        }
                        else {
                            if (env_config_1.configService.get('LOG').LEVEL.includes('WEBHOOKS')) {
                                const logData = {
                                    local: `${origin}.sendData-SQS`,
                                    ...message,
                                };
                                this.logger.log(logData);
                            }
                        }
                    });
                }
            }
        }
    }
    async saveQueues(instanceName, events, enable) {
        if (enable) {
            const eventsFinded = await this.listQueuesByInstance(instanceName);
            console.log('eventsFinded', eventsFinded);
            for (const event of events) {
                const normalizedEvent = event.toLowerCase();
                if (eventsFinded.includes(normalizedEvent)) {
                    this.logger.info(`A queue para o evento "${normalizedEvent}" já existe. Ignorando criação.`);
                    continue;
                }
                const queueName = `${instanceName}_${normalizedEvent}.fifo`;
                try {
                    const createCommand = new client_sqs_1.CreateQueueCommand({
                        QueueName: queueName,
                        Attributes: {
                            FifoQueue: 'true',
                        },
                    });
                    const data = await this.sqs.send(createCommand);
                    this.logger.info(`Queue ${queueName} criada: ${data.QueueUrl}`);
                }
                catch (err) {
                    this.logger.error(`Erro ao criar queue ${queueName}: ${err.message}`);
                }
            }
        }
    }
    async listQueuesByInstance(instanceName) {
        let existingQueues = [];
        try {
            const listCommand = new client_sqs_1.ListQueuesCommand({
                QueueNamePrefix: `${instanceName}_`,
            });
            const listData = await this.sqs.send(listCommand);
            if (listData.QueueUrls && listData.QueueUrls.length > 0) {
                existingQueues = listData.QueueUrls.map((queueUrl) => {
                    const parts = queueUrl.split('/');
                    return parts[parts.length - 1];
                });
            }
        }
        catch (error) {
            this.logger.error(`Erro ao listar filas para a instância ${instanceName}: ${error.message}`);
            return;
        }
        return existingQueues
            .map((queueName) => {
            if (queueName.startsWith(`${instanceName}_`) && queueName.endsWith('.fifo')) {
                return queueName.substring(instanceName.length + 1, queueName.length - 5).toLowerCase();
            }
            return '';
        })
            .filter((event) => event !== '');
    }
    async removeQueuesByInstance(instanceName) {
        try {
            const listCommand = new client_sqs_1.ListQueuesCommand({
                QueueNamePrefix: `${instanceName}_`,
            });
            const listData = await this.sqs.send(listCommand);
            if (!listData.QueueUrls || listData.QueueUrls.length === 0) {
                this.logger.info(`No queues found for instance ${instanceName}`);
                return;
            }
            for (const queueUrl of listData.QueueUrls) {
                try {
                    const deleteCommand = new client_sqs_1.DeleteQueueCommand({ QueueUrl: queueUrl });
                    await this.sqs.send(deleteCommand);
                    this.logger.info(`Queue ${queueUrl} deleted`);
                }
                catch (err) {
                    this.logger.error(`Error deleting queue ${queueUrl}: ${err.message}`);
                }
            }
        }
        catch (err) {
            this.logger.error(`Error listing queues for instance ${instanceName}: ${err.message}`);
        }
    }
}
exports.SqsController = SqsController;
