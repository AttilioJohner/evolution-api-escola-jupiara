import { RouterBroker } from '@api/abstract/abstract.router';
import { ConfigService } from '@config/env.config';
import { RequestHandler, Router } from 'express';
export declare class WebhookRouter extends RouterBroker {
    readonly configService: ConfigService;
    constructor(configService: ConfigService, ...guards: RequestHandler[]);
    readonly router: Router;
}
