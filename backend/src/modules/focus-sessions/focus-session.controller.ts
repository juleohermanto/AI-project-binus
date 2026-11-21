import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/require-auth';
import {
  completeFocusSessionSchema,
  createFocusSessionSchema,
  focusSessionParamsSchema,
  listFocusSessionsQuerySchema,
} from './focus-session.schema';
import * as focusSessionService from './focus-session.service';

export async function create(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const input = createFocusSessionSchema.parse(req.body);
  const session = await focusSessionService.startFocusSession(user.id, input);

  res.status(201).json({ data: session });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const query = listFocusSessionsQuerySchema.parse(req.query);
  const result = await focusSessionService.listFocusSessions(user.id, query);

  res.status(200).json({ data: result.sessions, meta: result.meta });
}

export async function getActive(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const session = await focusSessionService.getActiveFocusSession(user.id);

  res.status(200).json({ data: session });
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = focusSessionParamsSchema.parse(req.params);
  const session = await focusSessionService.getFocusSession(user.id, id);

  res.status(200).json({ data: session });
}

export async function complete(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = focusSessionParamsSchema.parse(req.params);
  const input = completeFocusSessionSchema.parse(req.body ?? {});
  const session = await focusSessionService.completeFocusSession(user.id, id, input);

  res.status(200).json({ data: session });
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = focusSessionParamsSchema.parse(req.params);
  const session = await focusSessionService.cancelFocusSession(user.id, id);

  res.status(200).json({ data: session });
}
