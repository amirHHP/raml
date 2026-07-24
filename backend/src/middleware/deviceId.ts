import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      deviceId: string;
    }
  }
}

export function requireDeviceId(req: Request, res: Response, next: NextFunction): void {
  const deviceId =
    (req.header('x-device-id') as string | undefined) ||
    (req.body?.deviceId as string | undefined) ||
    (req.query.deviceId as string | undefined);

  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
    res.status(400).json({ error: 'شناسه دستگاه الزامی است (x-device-id)' });
    return;
  }

  req.deviceId = deviceId;
  next();
}