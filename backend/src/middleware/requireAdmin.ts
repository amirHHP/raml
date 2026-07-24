import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!config.adminToken) {
    res.status(503).json({ error: 'ADMIN_TOKEN تنظیم نشده است' });
    return;
  }

  const header = req.header('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();

  if (!token || token !== config.adminToken) {
    res.status(401).json({ error: 'دسترسی ادمین غیرمجاز' });
    return;
  }

  next();
}
