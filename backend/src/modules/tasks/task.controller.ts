import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/require-auth';
import {
  createTaskSchema,
  listTasksQuerySchema,
  microStepInputSchema,
  taskParamsSchema,
  taskStepParamsSchema,
  updateMicroStepSchema,
  updateTaskSchema,
} from './task.schema';
import * as taskService from './task.service';

export async function create(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const input = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(user.id, input);

  res.status(201).json({ data: task });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const query = listTasksQuerySchema.parse(req.query);
  const result = await taskService.listTasks(user.id, query);

  res.status(200).json({ data: result.tasks, meta: result.meta });
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = taskParamsSchema.parse(req.params);
  const task = await taskService.getTask(user.id, id);

  res.status(200).json({ data: task });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = taskParamsSchema.parse(req.params);
  const input = updateTaskSchema.parse(req.body);
  const task = await taskService.updateTask(user.id, id, input);

  res.status(200).json({ data: task });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = taskParamsSchema.parse(req.params);

  await taskService.deleteTask(user.id, id);

  res.status(204).send();
}

export async function complete(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = taskParamsSchema.parse(req.params);
  const task = await taskService.completeTask(user.id, id);

  res.status(200).json({ data: task });
}

export async function reopen(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = taskParamsSchema.parse(req.params);
  const task = await taskService.reopenTask(user.id, id);

  res.status(200).json({ data: task });
}

export async function addStep(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = taskParamsSchema.parse(req.params);
  const input = microStepInputSchema.parse(req.body);
  const task = await taskService.addMicroStep(user.id, id, input);

  res.status(201).json({ data: task });
}

export async function updateStep(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id, stepId } = taskStepParamsSchema.parse(req.params);
  const input = updateMicroStepSchema.parse(req.body);
  const task = await taskService.updateMicroStep(user.id, id, stepId, input);

  res.status(200).json({ data: task });
}

export async function removeStep(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id, stepId } = taskStepParamsSchema.parse(req.params);
  const task = await taskService.deleteMicroStep(user.id, id, stepId);

  res.status(200).json({ data: task });
}

export async function completeStep(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id, stepId } = taskStepParamsSchema.parse(req.params);
  const task = await taskService.setMicroStepCompletion(user.id, id, stepId, true);

  res.status(200).json({ data: task });
}

export async function reopenStep(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id, stepId } = taskStepParamsSchema.parse(req.params);
  const task = await taskService.setMicroStepCompletion(user.id, id, stepId, false);

  res.status(200).json({ data: task });
}
