import { RouterBroker } from '@api/abstract/abstract.router';
import { RequestHandler, Router } from 'express';
export declare class ChatwootRouter extends RouterBroker {
    constructor(...guards: RequestHandler[]);
    readonly router: Router;
}
