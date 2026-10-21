import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middlewares/auth';
import type { AuthedRequest } from '../types';
import { ProjectStatus } from '../types';

export const dashboardRouter = Router();

// Comprehensive Dashboard Endpoint
dashboardRouter.get('/', requireAuth, async (_req: AuthedRequest, res, next) => {
  try {
    const [
      total,
      approved,
      resubmit,
      drafts,
      canceled,
      budgetAggregate,
      approvedBudgetAggregate,
      byStrategyCount,
      allStrategies,
      allBudgets,
      allMajors,
      projectsForBreakdown,
    ] = await Promise.all([
      prisma.projectForm.count(),
      prisma.projectForm.count({ where: { status: ProjectStatus.approve } }),
      prisma.projectForm.count({ where: { status: ProjectStatus.resubmit } }),
      prisma.projectForm.count({
        where: {
          OR: [{ status: ProjectStatus.draft }, { status: ProjectStatus.submitted }, { status: ProjectStatus.EMPTY_ENUM_VALUE }],
        },
      }),
      prisma.projectForm.count({ where: { status: ProjectStatus.cancel } }),
      prisma.projectForm.aggregate({ _sum: { budget_amount: true } }),
      prisma.projectForm.aggregate({
        where: { status: ProjectStatus.approve },
        _sum: { budget_amount: true },
      }),
      prisma.projectForm.groupBy({
        by: ['strategic_plan_id'],
        _count: { _all: true },
        _sum: { budget_amount: true },
      }),
      prisma.strategicPlan.findMany({ orderBy: { id: 'asc' } }),
      prisma.operatingBudget.findMany({ orderBy: { id: 'asc' } }),
      prisma.major.findMany({ orderBy: { id: 'asc' } }),
      prisma.projectForm.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          budget_amount: true,
          project_kpi: true,
          operating_budget_id: true,
          strategic_plan_id: true,
          create_by: true,
          department_id: true,
          department: true,
          user: { select: { Major_id: true, major: { select: { name: true } } } },
        },
      }),
    ]);

    // Total KPIs count
    const kpiTotal = projectsForBreakdown.reduce((totalKpi, p) => {
      const lines = (p.project_kpi || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return totalKpi + Math.max(lines.length, (p.project_kpi || '').trim() ? 1 : 0);
    }, 0);

    // Strategy Breakdown
    const byStrategy = allStrategies.map((s) => {
      const match = byStrategyCount.find((item) => item.strategic_plan_id === s.id);
      return {
        strategic_plan_id: s.id,
        name: s.name,
        count: match ? match._count._all : 0,
        budget: match && match._sum.budget_amount ? match._sum.budget_amount : 0,
      };
    });

    // Budget Breakdown
    const budgetStatsMap = new Map<number, { count: number; amount: number }>();
    projectsForBreakdown.forEach((p) => {
      const current = budgetStatsMap.get(p.operating_budget_id) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += p.budget_amount || 0;
      budgetStatsMap.set(p.operating_budget_id, current);
    });

    const byBudget = allBudgets.map((b) => ({
      id: b.id,
      name: b.name,
      count: budgetStatsMap.get(b.id)?.count || 0,
      amount: budgetStatsMap.get(b.id)?.amount || 0,
    }));

    // Department Breakdown
    const deptStatsMap = new Map<number, { name: string; count: number; approved: number; resubmit: number; budget: number }>();
    projectsForBreakdown.forEach((p) => {
      const majorId = p.department_id ?? p.user?.Major_id ?? 0;
      const majorName = p.department?.name || p.user?.major?.name || 'ไม่ระบุ';
      const cur = deptStatsMap.get(majorId) || { name: majorName, count: 0, approved: 0, resubmit: 0, budget: 0 };
      cur.count += 1;
      if (p.status === ProjectStatus.approve) cur.approved += 1;
      if (p.status === ProjectStatus.resubmit) cur.resubmit += 1;
      cur.budget += p.budget_amount || 0;
      deptStatsMap.set(majorId, cur);
    });

    const byDepartment = Array.from(deptStatsMap.entries()).map(([majorId, val]) => ({
      majorId,
      name: val.name,
      count: val.count,
      approved: val.approved,
      resubmit: val.resubmit,
      budget: val.budget,
    })).sort((a, b) => b.count - a.count);

    res.json({
      total,
      approved,
      resubmit,
      drafts,
      canceled,
      kpiTotal,
      budgetTotal: budgetAggregate._sum.budget_amount || 0,
      approvedBudgetTotal: approvedBudgetAggregate._sum.budget_amount || 0,
      byStrategy,
      byBudget,
      byDepartment,
    });
  } catch (error) {
    next(error);
  }
});
