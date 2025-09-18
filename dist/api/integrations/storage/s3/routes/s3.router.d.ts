import { RouterBroker } from '@api/abstract/abstract.router';
import { RequestHandler, Router } from 'express';
export declare class S3Router extends RouterBroker {
    constructor(...guards: RequestHandler[]);
    readonly router: Router;
}
