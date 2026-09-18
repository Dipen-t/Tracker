import { Request, Response, NextFunction } from 'express';
import { TimeService } from './time.service';

export class TimeController {
  static async getAllLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filter = (req.query.filter as string) || 'all';

      const result = await TimeService.getAllLogs(req.user!.id, { page, limit, filter });
      
      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async start(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const log = await TimeService.startTimer(req.user!.id, id);
      
      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  static async stop(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const log = await TimeService.stopTimer(req.user!.id, id);
      
      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await TimeService.getActiveTimer(req.user!.id);
      
      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const logs = await TimeService.getTaskTimeLogs(req.user!.id, id);
      
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const total = await TimeService.getTaskTotalTime(req.user!.id, id);
      
      res.status(200).json({
        success: true,
        data: total,
      });
    } catch (error) {
      next(error);
    }
  }
}
