import { InstanceDto } from '@api/dto/instance.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
export declare class BaileysController {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    onWhatsapp({ instanceName }: InstanceDto, body: any): Promise<any>;
    profilePictureUrl({ instanceName }: InstanceDto, body: any): Promise<any>;
    assertSessions({ instanceName }: InstanceDto, body: any): Promise<any>;
    createParticipantNodes({ instanceName }: InstanceDto, body: any): Promise<any>;
    getUSyncDevices({ instanceName }: InstanceDto, body: any): Promise<any>;
    generateMessageTag({ instanceName }: InstanceDto): Promise<any>;
    sendNode({ instanceName }: InstanceDto, body: any): Promise<any>;
    signalRepositoryDecryptMessage({ instanceName }: InstanceDto, body: any): Promise<any>;
    getAuthState({ instanceName }: InstanceDto): Promise<any>;
}
