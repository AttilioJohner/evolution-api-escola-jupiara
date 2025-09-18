import { NextFunction, Request, Response } from 'express';
export declare function instanceExistsGuard(req: Request, _: Response, next: NextFunction): Promise<void>;
export declare function instanceLoggedGuard(req: Request, _: Response, next: NextFunction): Promise<void>;
