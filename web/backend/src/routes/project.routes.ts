import { Router } from 'express';
import { Role, type Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth } from '../middlewares/auth';
import type { AuthedRequest } from '../types';
import { ProjectStatus } from '../types';
import {
  requiredString,
  optionalString,
  optionalNumber,
  normalizeStatus,
  serializeProject,
} from '../utils/helpers';
import { generateProjectDocx } from '../services/docx.service';

export const projectRouter = Router();

// Projects Listing
projectRouter.get('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const search = optionalString(req.query.search);
    const statusParam = optionalString(req.query.status);
    const strategyParam = optionalNumber(req.query.strategyId);
    const filterMine = req.query.filter === 'mine';
    const majorIdParam = optionalNumber(req.query.majorId);

    const where: Prisma.ProjectFormWhereInput = {};

    if (filterMine) {
      where.create_by = req.user!.id;
    }

    if (majorIdParam) {
      where.user = { Major_id: majorIdParam };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { responsible_person: { contains: search } },
        { target_group: { contains: search } },
      ];
    }

    if (statusParam && Object.values(ProjectStatus).includes(statusParam as ProjectStatus)) {
      where.status = statusParam as ProjectStatus;
    }

    if (strategyParam) {
      where.strategic_plan_id = strategyParam;
    }

    const projects = await prisma.projectForm.findMany({
      where,
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
      orderBy: { update_at: 'desc' },
    });

    res.json({ projects: projects.map((project) => serializeProject(project)) });
  } catch (error) {
    next(error);
  }
});

// Single Project
projectRouter.get('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const project = await prisma.projectForm.findUnique({
      where: { id },
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
    });

    if (!project) {
      res.status(404).json({ message: 'ไม่พบโครงการ' });
      return;
    }

    res.json({ project: serializeProject(project) });
  } catch (error) {
    next(error);
  }
});

// Create Project
projectRouter.post('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const project = await prisma.projectForm.create({
      data: {
        name: requiredString(req.body.name, 'ชื่อโครงการ'),
        strategic_plan_id: Number(req.body.strategic_plan_id),
        responsible_person: requiredString(req.body.responsible_person, 'ผู้รับผิดชอบ'),
        principles_rationale: requiredString(req.body.principles_rationale, 'หลักการและเหตุผล'),
        objective: requiredString(req.body.objective, 'วัตถุประสงค์'),
        target_group: requiredString(req.body.target_group, 'กลุ่มเป้าหมาย'),
        implementation_procedure: requiredString(
          req.body.implementation_procedure,
          'วิธีดำเนินการ',
        ),
        duration_of_operations: requiredString(
          req.body.duration_of_operations,
          'ระยะเวลาดำเนินงาน',
        ),
        location: optionalString(req.body.location) || '-',
        evaluation: optionalString(req.body.evaluation) || '-',
        expected_outcomes: optionalString(req.body.expected_outcomes) || '-',
        strategic_goal: optionalString(req.body.strategic_goal),
        strategic_kpi: optionalString(req.body.strategic_kpi),
        project_kpi: optionalString(req.body.project_kpi || req.body.evaluation),
        kpi_target: optionalString(req.body.kpi_target),
        target_date: optionalString(req.body.target_date),
        budget_amount: optionalNumber(req.body.budget_amount),
        operation_plan: optionalString(req.body.operation_plan || req.body.implementation_procedure),
        progress_risk: optionalString(req.body.progress_risk),
        review_comment: optionalString(req.body.review_comment),
        operating_budget_id: Number(req.body.operating_budget_id),
        create_by: req.user!.id,
        status: normalizeStatus(req.body.status),
      },
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
    });

    res.status(201).json({ project: serializeProject(project) });
  } catch (error) {
    next(error);
  }
});

// Update Project
projectRouter.patch('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.projectForm.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ message: 'ไม่พบโครงการ' });
      return;
    }

    if (req.user!.role === Role.staff && existing.create_by !== req.user!.id) {
      res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขโครงการนี้' });
      return;
    }

    const updateData: Prisma.ProjectFormUncheckedUpdateInput = {};

    if (req.body.name !== undefined) updateData.name = requiredString(req.body.name, 'ชื่อโครงการ');
    if (req.body.strategic_plan_id !== undefined) updateData.strategic_plan_id = Number(req.body.strategic_plan_id);
    if (req.body.responsible_person !== undefined) updateData.responsible_person = requiredString(req.body.responsible_person, 'ผู้รับผิดชอบ');
    if (req.body.principles_rationale !== undefined) updateData.principles_rationale = requiredString(req.body.principles_rationale, 'หลักการและเหตุผล');
    if (req.body.objective !== undefined) updateData.objective = requiredString(req.body.objective, 'วัตถุประสงค์');
    if (req.body.target_group !== undefined) updateData.target_group = requiredString(req.body.target_group, 'กลุ่มเป้าหมาย');
    if (req.body.implementation_procedure !== undefined) updateData.implementation_procedure = requiredString(req.body.implementation_procedure, 'วิธีดำเนินการ');
    if (req.body.duration_of_operations !== undefined) updateData.duration_of_operations = requiredString(req.body.duration_of_operations, 'ระยะเวลาดำเนินงาน');
    if (req.body.location !== undefined) updateData.location = optionalString(req.body.location) || '-';
    if (req.body.evaluation !== undefined) updateData.evaluation = optionalString(req.body.evaluation) || '-';
    if (req.body.expected_outcomes !== undefined) updateData.expected_outcomes = optionalString(req.body.expected_outcomes) || '-';
    if (req.body.strategic_goal !== undefined) updateData.strategic_goal = optionalString(req.body.strategic_goal);
    if (req.body.strategic_kpi !== undefined) updateData.strategic_kpi = optionalString(req.body.strategic_kpi);
    if (req.body.project_kpi !== undefined) updateData.project_kpi = optionalString(req.body.project_kpi);
    if (req.body.kpi_target !== undefined) updateData.kpi_target = optionalString(req.body.kpi_target);
    if (req.body.target_date !== undefined) updateData.target_date = optionalString(req.body.target_date);
    if (req.body.budget_amount !== undefined) updateData.budget_amount = optionalNumber(req.body.budget_amount);
    if (req.body.operation_plan !== undefined) updateData.operation_plan = optionalString(req.body.operation_plan);
    if (req.body.progress_risk !== undefined) updateData.progress_risk = optionalString(req.body.progress_risk);
    if (req.body.operating_budget_id !== undefined) updateData.operating_budget_id = Number(req.body.operating_budget_id);
    if (req.body.status !== undefined) updateData.status = normalizeStatus(req.body.status);
    if (req.body.review_comment !== undefined) updateData.review_comment = optionalString(req.body.review_comment);

    const project = await prisma.projectForm.update({
      where: { id },
      data: updateData,
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
    });

    res.json({ project: serializeProject(project) });
  } catch (error) {
    next(error);
  }
});

// Branch Staff Progress Update Endpoint
projectRouter.patch('/:id/progress', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.projectForm.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ message: 'ไม่พบโครงการ' });
      return;
    }

    const progress_risk = optionalString(req.body.progress_risk);
    const operation_plan = optionalString(req.body.operation_plan);
    const evaluation = optionalString(req.body.evaluation);

    const updated = await prisma.projectForm.update({
      where: { id },
      data: {
        ...(progress_risk ? { progress_risk } : {}),
        ...(operation_plan ? { operation_plan } : {}),
        ...(evaluation ? { evaluation } : {}),
      },
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
    });

    res.json({
      message: 'อัปเดตรายงานความก้าวหน้าโครงการเรียบร้อยแล้ว',
      project: serializeProject(updated),
    });
  } catch (error) {
    next(error);
  }
});

// Approved & Resubmit Workflow Endpoint
projectRouter.post('/:id/review', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const action = req.body.action as 'approve' | 'resubmit' | 'cancel' | 'draft';
    const comment = optionalString(req.body.comment);

    const existing = await prisma.projectForm.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'ไม่พบโครงการ' });
      return;
    }

    let nextStatus: ProjectStatus;
    if (action === 'approve') {
      nextStatus = ProjectStatus.approve;
    } else if (action === 'resubmit') {
      nextStatus = ProjectStatus.resubmit;
    } else if (action === 'cancel') {
      nextStatus = ProjectStatus.cancel;
    } else {
      nextStatus = ProjectStatus.draft;
    }

    const updated = await prisma.projectForm.update({
      where: { id },
      data: {
        status: nextStatus,
        review_comment: comment || existing.review_comment,
      },
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
    });

    res.json({
      message:
        action === 'approve'
          ? 'อนุมัติโครงการเรียบร้อยแล้ว'
          : action === 'resubmit'
            ? 'ส่งกลับโครงการเพื่อแก้ไขเรียบร้อยแล้ว'
            : action === 'cancel'
              ? 'ยกเลิกโครงการแล้ว'
              : 'อัปเดตสถานะโครงการเรียบร้อยแล้ว',
      project: serializeProject(updated),
    });
  } catch (error) {
    next(error);
  }
});

// Delete Project
projectRouter.delete('/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.projectForm.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ message: 'ไม่พบโครงการ' });
      return;
    }

    if (req.user!.role === Role.staff && existing.create_by !== req.user!.id) {
      res.status(403).json({ message: 'ไม่มีสิทธิ์ลบโครงการนี้' });
      return;
    }

    await prisma.projectForm.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Official Word (.docx) Generation & Download
projectRouter.get('/:id/export-word', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const project = await prisma.projectForm.findUnique({
      where: { id },
      include: {
        operating_budget: true,
        strategic_plan: true,
        user: { include: { major: true } },
      },
    });

    if (!project) {
      res.status(404).send('ไม่พบโครงการ');
      return;
    }

    const buffer = await generateProjectDocx(project);
    const sanitizedFilename = `Project_${project.id}_${encodeURIComponent(project.name.slice(0, 30))}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});
