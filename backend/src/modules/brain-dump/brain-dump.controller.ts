import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/require-auth';
import { brainDumpRequestSchema } from './brain-dump.schema';
import * as brainDumpService from './brain-dump.service';

export async function create(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const input = brainDumpRequestSchema.parse(req.body);
  const result = await brainDumpService.processBrainDump(user.id, input);

  res.status(201).json({
    data: result.tasks,
    meta: result.meta,
  });
}
