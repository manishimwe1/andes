import { Router, Request, Response } from 'express';

/**
 * Create health check route
 */
export function createHealthRoutes(): Router {
  const router = Router();

  /**
   * Health check endpoint
   * GET /api/health
   */
  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  /**
   * Ready check endpoint
   * GET /api/ready
   */
  router.get('/ready', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
