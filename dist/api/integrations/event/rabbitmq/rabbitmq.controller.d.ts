import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import * as amqp from 'amqplib/callback_api';
import { EmitData, EventController, EventControllerInterface } from '../event.controller';
export declare class RabbitmqController extends EventController implements EventControllerInterface {
    amqpChannel: amqp.Channel | null;
    private amqpConnection;
    private readonly logger;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private isReconnecting;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    init(): Promise<void>;
    private connect;
    private handleConnectionLoss;
    private scheduleReconnect;
    private set channel(value);
    get channel(): amqp.Channel;
    private ensureConnection;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }: EmitData): Promise<void>;
    private initGlobalQueues;
    cleanup(): Promise<void>;
}
