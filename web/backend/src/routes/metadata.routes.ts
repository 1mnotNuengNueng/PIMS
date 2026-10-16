import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middlewares/auth';

export const metadataRouter = Router();

metadataRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const [majors, strategicPlans, operatingBudgets] = await Promise.all([
      prisma.major.findMany({ orderBy: { id: 'asc' } }),
      prisma.strategicPlan.findMany({ orderBy: { id: 'asc' } }),
      prisma.operatingBudget.findMany({ orderBy: { id: 'asc' } }),
    ]);

    res.json({ majors, strategicPlans, operatingBudgets });
  } catch (error) {
    next(error);
  }
});
