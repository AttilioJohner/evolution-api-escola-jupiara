import { RouterBroker } from '@api/abstract/abstract.router';
import { ConfigService } from '@config/env.config';
import { Router } from 'express';
export declare class EvolutionRouter extends RouterBroker {
    readonly configService: ConfigService;
    constructor(configService: ConfigService);
    readonly router: Router;
}
