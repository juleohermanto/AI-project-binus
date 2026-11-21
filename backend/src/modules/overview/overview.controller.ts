import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/require-auth';
import { overviewQuerySchema } from './overview.schema';
import * as overviewService from './overview.service';

export async function getOverview(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const query = overviewQuerySchema.parse(req.query);
  const overview = await overviewService.getDailyOverview(user.id, query);

  res.status(200).json({ data: overview });
}
