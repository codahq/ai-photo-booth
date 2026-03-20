import { Router, Request, Response } from 'express';
import { deleteSessionById, loadSessions } from '../storage/imageStore';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  try {
    const sessions = loadSessions();
    res.json(sessions);
  } catch (error: unknown) {
    console.error('History error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to load history', details: message });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const deleted = deleteSessionById(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(204).send();
  } catch (error: unknown) {
    console.error('Delete history error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to delete session', details: message });
  }
});

export default router;
