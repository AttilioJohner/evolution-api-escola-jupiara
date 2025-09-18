import { WAConnectionState, WASocket } from 'baileys';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './transport.type';
export declare const useVoiceCallsBaileys: (wavoip_token: string, baileys_sock: WASocket, status?: WAConnectionState, logger?: boolean) => Promise<Socket<ServerToClientEvents, ClientToServerEvents>>;
