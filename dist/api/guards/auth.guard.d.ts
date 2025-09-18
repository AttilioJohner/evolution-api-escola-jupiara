import { NextFunction, Request, Response } from 'express';
declare function apikey(req: Request, _: Response, next: NextFunction): Promise<void>;
export declare const authGuard: {
    apikey: typeof apikey;
};
export {};
