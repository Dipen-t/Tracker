import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { createTaskSchema, updateTaskSchema } from './task.validation';

export class TaskController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { rawInput } = req.body;
      if (!rawInput) {
        return res.status(400).json({ success: false, message: 'rawInput is required' });
      }

      const generated = await TaskService.generateTaskDetails(rawInput);
      
      res.status(200).json({
        success: true,
        data: generated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.parse(req.body);
      const task = await TaskService.create(req.user!.id, data);
      
      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await TaskService.getAll(req.user!.id);
      
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const task = await TaskService.getById(req.user!.id, id);
      
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateTaskSchema.parse(req.body);
      const updatedTask = await TaskService.update(req.user!.id, id, data);
      
      res.status(200).json({
        success: true,
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await TaskService.delete(req.user!.id, id);
      
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
