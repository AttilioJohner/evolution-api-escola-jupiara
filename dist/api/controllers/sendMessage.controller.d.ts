import { InstanceDto } from '@api/dto/instance.dto';
import { SendAudioDto, SendButtonsDto, SendContactDto, SendListDto, SendLocationDto, SendMediaDto, SendPollDto, SendPtvDto, SendReactionDto, SendStatusDto, SendStickerDto, SendTemplateDto, SendTextDto } from '@api/dto/sendMessage.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
export declare class SendMessageController {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    sendTemplate({ instanceName }: InstanceDto, data: SendTemplateDto): Promise<any>;
    sendText({ instanceName }: InstanceDto, data: SendTextDto): Promise<any>;
    sendMedia({ instanceName }: InstanceDto, data: SendMediaDto, file?: any): Promise<any>;
    sendPtv({ instanceName }: InstanceDto, data: SendPtvDto, file?: any): Promise<any>;
    sendSticker({ instanceName }: InstanceDto, data: SendStickerDto, file?: any): Promise<any>;
    sendWhatsAppAudio({ instanceName }: InstanceDto, data: SendAudioDto, file?: any): Promise<any>;
    sendButtons({ instanceName }: InstanceDto, data: SendButtonsDto): Promise<any>;
    sendLocation({ instanceName }: InstanceDto, data: SendLocationDto): Promise<any>;
    sendList({ instanceName }: InstanceDto, data: SendListDto): Promise<any>;
    sendContact({ instanceName }: InstanceDto, data: SendContactDto): Promise<any>;
    sendReaction({ instanceName }: InstanceDto, data: SendReactionDto): Promise<any>;
    sendPoll({ instanceName }: InstanceDto, data: SendPollDto): Promise<any>;
    sendStatus({ instanceName }: InstanceDto, data: SendStatusDto, file?: any): Promise<any>;
}
