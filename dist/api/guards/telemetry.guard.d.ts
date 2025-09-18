import { NextFunction, Request, Response } from 'express';
declare class Telemetry {
    collectTelemetry(req: Request, res: Response, next: NextFunction): void;
}
export default Telemetry;
