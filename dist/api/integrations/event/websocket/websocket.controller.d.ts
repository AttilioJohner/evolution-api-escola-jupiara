import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Server } from 'http';
import { Server as SocketIO } from 'socket.io';
import { EmitData, EventController, EventControllerInterface } from '../event.controller';
export declare class WebsocketController extends EventController implements EventControllerInterface {
    private io;
    private corsConfig;
    private readonly logger;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    init(httpServer: Server): void;
    private set cors(value);
    private get cors();
    private set socket(value);
    get socket(): SocketIO;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }: EmitData): Promise<void>;
}
