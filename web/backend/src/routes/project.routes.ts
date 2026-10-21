import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Role, type Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth } from '../middlewares/auth';
import type { AuthedRequest } from '../types';
import { ProjectStatus } from '../types';
import {
  requiredString,
  optionalString,
  optionalNumber,
  serializeProject,
} from '../utils/helpers';
import { generateProjectDocx } from '../services/docx.service';
import { validateFiscalPeriod } from '../utils/fiscalPeriod';
import { ProjectWorkflowError, ensureProjectPeriods, validateReplacement, reviewProject } from '../services/project-workflow.service';
import { saveQuarterlyReport } from '../services/quarterly-submit.service';
import { departmentProjectFilter } from '../utils/projectDepartment';
import { handleCancellation } from '../services/cancellation-request.service';

export const projectRouter = Router();

async function resolveDepartment(name: unknown, user: NonNullable<AuthedRequest['user']>) {
  if (user.role === Role.staff) return user.majorId;
  const department = await prisma.major.findFirst({ where: { name: requiredString(name, 'หน่วยงาน') } });
  if (!department) throw new ProjectWorkflowError(400, 'ไม่พบหน่วยงานที่เลือก');
  return department.id;
}

// Projects Listing
projectRouter.get('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const search = optionalString(req.query.search);
    const statusParam = optionalString(req.query.status);
    const strategyParam = optionalNumber(req.query.strategyId);
    const filterMine = req.query.filter === 'mine';
    const majorIdParam = optionalNumber(req.query.majorId);

    const where: Prisma.ProjectFormWhereInput = {};

    if (req.user!.role === Role.staff) {
      Object.assign(where, departmentProjectFilter(req.user!.majorId));
    } else if (filterMine) {
      where.create_by = req.user!.id;
    }

    if (majorIdParam) {
      const requestedDepartment = departmentProjectFilter(majorIdParam);
      where.AND = [requestedDepartment];
    }

    if (search) {
      const searchFilter = { OR: [
        { name: { contains: search } },
        { responsible_person: { contains: search } },
        { target_group: { contains: search } },
        { department: { name: { contains: search } } },
      ] };
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), searchFilter];
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
        department: true, user: { include: { major: true } },
        quarterly_reports: {
          take: 1,
          orderBy: [{ fiscal_period: { fiscal_year: { year: 'desc' } } }, { fiscal_period: { quarter: 'desc' } }],
          select: { id: true, status: true, progress_percent: true, budget_spent: true,
            fiscal_period: { select: { quarter: true, fiscal_year: { select: { year: true } } } } },
        },
      },
      orderBy: { update_at: 'desc' },
    });

    res.json({ projects: projects.map(({ quarterly_reports, ...project }) => {
      const report = quarterly_reports[0];
      return { ...serializeProject(project), latest_report: report ? {
        id: report.id, status: report.status, progress_percent: Number(report.progress_percent),
        budget_spent: Number(report.budget_spent), fiscal_year: report.fiscal_period.fiscal_year.year,
        quarter: report.fiscal_period.quarter,
      } : null };
    }) });
  } catch (error) {
    next(error);
  }
});

// Admin detail page: each report keeps its own fiscal period and review status.
projectRouter.get(['/:id/review-details', '/:id/reporting'], requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (req.path.endsWith('/review-details') && req.user!.role !== Role.admin && req.user!.role !== Role.super_admin) {
      res.status(403).json({ message: 'เฉพาะผู้ตรวจโครงการเท่านั้น' });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'รหัสโครงการไม่ถูกต้อง' });
      return;
    }
    const project = await prisma.projectForm.findUnique({
      where: { id },
      include: {
        operating_budget: true, strategic_plan: true,
        replacement_for: { select: { id: true, name: true } },
        replacement_projects: { select: { id: true, name: true, fiscal_year: true, quarter: true } },
        department: true, user: { select: { Email: true, Major_id: true, major: { select: { name: true } } } },
        quarterly_reports: {
          include: {
            fiscal_period: { include: { fiscal_year: true } },
            author: { select: { id: true, Email: true } },
            reviewer: { select: { id: true, Email: true } },
          },
        },
      },
    });
    if (!project) { res.status(404).json({ message: 'ไม่พบโครงการ' }); return; }
    if (req.user!.role === Role.staff && (project.department_id ?? project.user.Major_id) !== req.user!.majorId) throw new ProjectWorkflowError(403, 'ไม่มีสิทธิ์ดูรายงานของหน่วยงานอื่น');
    const { quarterly_reports, ...projectData } = project;
    const years = [...new Set([project.fiscal_year, ...quarterly_reports.map((report) => report.fiscal_period.fiscal_year.year)].filter((year): year is number => year !== null))];
    const periods = await prisma.fiscalPeriod.findMany({
      where: { fiscal_year: { year: { in: years } } },
      include: { fiscal_year: true }, orderBy: [{ fiscal_year: { year: 'asc' } }, { quarter: 'asc' }],
    });
    res.json({
      project: serializeProject(projectData), periods,
      reports: quarterly_reports.map((report) => ({ ...report, budget_spent: Number(report.budget_spent), progress_percent: Number(report.progress_percent) })),
    });
  } catch (error) { next(error); }
});

projectRouter.put('/:id/quarterly-reports', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new ProjectWorkflowError(400, 'รหัสโครงการไม่ถูกต้อง');
    const report = await prisma.$transaction((tx) => saveQuarterlyReport(tx, id, req.user!, req.body), { timeout: 15000 });
    res.json({ report, message: req.body.status === 'submitted' ? 'ส่งรายงานรอพิจารณาแล้ว' : 'บันทึกร่างรายงานแล้ว' });
  } catch (error) { next(error); }
});

projectRouter.post('/:id/quarterly-reports/:reportId/review', requireAuth, (_req, res) => {
  res.status(410).json({ message: 'รายงานความคืบหน้าใช้อัปเดตข้อมูลโดยไม่ต้องอนุมัติรายงาน' });
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
        department: true, user: { include: { major: true } },
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
    validateFiscalPeriod(req.body.fiscal_year, req.body.quarter);
    const status = req.body.status || 'draft';
    const departmentId = await resolveDepartment(req.body.department_name, req.user!);
    const projectString = (value: unknown, field: string) => status === 'submitted' ? requiredString(value, field) : optionalString(value);
    if (status !== 'draft' && status !== 'submitted') throw new ProjectWorkflowError(400, 'บันทึกข้อเสนอเป็นฉบับร่างหรือส่งรอพิจารณาเท่านั้น');
    const replacementId = req.body.replacement_for_id == null ? null : Number(req.body.replacement_for_id);
    if (replacementId !== null && (!Number.isInteger(replacementId) || replacementId <= 0)) throw new ProjectWorkflowError(400, 'รหัสโครงการเดิมไม่ถูกต้อง');
    const project = await prisma.$transaction(async (tx) => {
      if (replacementId) await validateReplacement(tx, replacementId, Number(req.body.fiscal_year), Number(req.body.quarter), req.user!);
      await ensureProjectPeriods(tx, Number(req.body.fiscal_year));
      return tx.projectForm.create({
      data: {
        replacement_for_id: replacementId,
        department_id: departmentId,
        submitted_at: status === 'submitted' ? new Date() : null,
        fiscal_year: Number(req.body.fiscal_year),
        quarter: Number(req.body.quarter),
        name: projectString(req.body.name, 'ชื่อโครงการ'),
        strategic_plan_id: Number(req.body.strategic_plan_id),
        responsible_person: projectString(req.body.responsible_person, 'ผู้รับผิดชอบ'),
        principles_rationale: projectString(req.body.principles_rationale, 'หลักการและเหตุผล'),
        objective: projectString(req.body.objective, 'วัตถุประสงค์'),
        target_group: projectString(req.body.target_group, 'กลุ่มเป้าหมาย'),
        implementation_procedure: projectString(
          req.body.implementation_procedure,
          'วิธีดำเนินการ',
        ),
        duration_of_operations: projectString(
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
        operating_budget_id: Number(req.body.operating_budget_id),
        create_by: req.user!.id,
        status,
      },
      include: {
        operating_budget: true,
        strategic_plan: true,
        department: true, user: { include: { major: true } },
      },
      });
    }, { timeout: 15000 });

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

    const owner = await prisma.user.findUnique({ where: { id: existing.create_by }, select: { Major_id: true } });
    if (req.user!.role === Role.staff && (existing.department_id ?? owner?.Major_id) !== req.user!.majorId) {
      res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขโครงการนี้' });
      return;
    }

    const status = req.body.status ?? existing.status;
    const projectString = (value: unknown, field: string) => status === 'submitted' ? requiredString(value, field) : optionalString(value);
    if (status === 'submitted') {
      const requiredFields = {
        name: 'ชื่อโครงการ',
        responsible_person: 'ผู้รับผิดชอบ',
        principles_rationale: 'หลักการและเหตุผล',
        objective: 'วัตถุประสงค์',
        target_group: 'กลุ่มเป้าหมาย',
        implementation_procedure: 'วิธีดำเนินการ',
        duration_of_operations: 'ระยะเวลาดำเนินงาน',
      } as const;
      for (const [field, label] of Object.entries(requiredFields)) {
        requiredString(req.body[field] === undefined ? existing[field as keyof typeof requiredFields] : req.body[field], label);
      }
    }
    const updateData: Prisma.ProjectFormUncheckedUpdateInput = {};
    if (req.body.department_name !== undefined) updateData.department_id = await resolveDepartment(req.body.department_name, req.user!);
    if (existing.status !== 'draft' && existing.status !== 'resubmit' && existing.status !== 'approve' && existing.status !== ProjectStatus.EMPTY_ENUM_VALUE) {
      throw new ProjectWorkflowError(409, existing.status === 'cancel' ? 'โครงการยกเลิกแล้ว กรุณาสร้างโครงการใหม่' : 'โครงการอยู่ระหว่างพิจารณา ยังแก้ไขไม่ได้');
    }
    if (existing.status === 'approve' && req.body.status !== undefined) throw new ProjectWorkflowError(400, 'การแก้ไขโครงการที่อนุมัติแล้วต้องคงสถานะอนุมัติเดิม');
    if (req.body.fiscal_year !== undefined || req.body.quarter !== undefined) {
      const year = req.body.fiscal_year === undefined ? existing.fiscal_year : req.body.fiscal_year;
      const quarter = req.body.quarter === undefined ? existing.quarter : req.body.quarter;
      validateFiscalPeriod(year, quarter);
      updateData.fiscal_year = Number(year);
      updateData.quarter = Number(quarter);
    }

    if (req.body.name !== undefined) updateData.name = projectString(req.body.name, 'ชื่อโครงการ');
    if (req.body.strategic_plan_id !== undefined) updateData.strategic_plan_id = Number(req.body.strategic_plan_id);
    if (req.body.responsible_person !== undefined) updateData.responsible_person = projectString(req.body.responsible_person, 'ผู้รับผิดชอบ');
    if (req.body.principles_rationale !== undefined) updateData.principles_rationale = projectString(req.body.principles_rationale, 'หลักการและเหตุผล');
    if (req.body.objective !== undefined) updateData.objective = projectString(req.body.objective, 'วัตถุประสงค์');
    if (req.body.target_group !== undefined) updateData.target_group = projectString(req.body.target_group, 'กลุ่มเป้าหมาย');
    if (req.body.implementation_procedure !== undefined) updateData.implementation_procedure = projectString(req.body.implementation_procedure, 'วิธีดำเนินการ');
    if (req.body.duration_of_operations !== undefined) updateData.duration_of_operations = projectString(req.body.duration_of_operations, 'ระยะเวลาดำเนินงาน');
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
    if (req.body.status !== undefined) {
      if (req.body.status !== 'draft' && req.body.status !== 'submitted') throw new ProjectWorkflowError(400, 'กรุณาบันทึกฉบับร่างหรือส่งรอพิจารณา');
      updateData.status = req.body.status;
      if (req.body.status === 'submitted') updateData.submitted_at = new Date();
    }

    const project = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM project_form WHERE id = ${id} FOR UPDATE`;
      const current = await tx.projectForm.findUniqueOrThrow({ where: { id } });
      if (current.status !== existing.status || current.update_at.getTime() !== existing.update_at.getTime()) throw new ProjectWorkflowError(409, 'ข้อมูลโครงการเปลี่ยนไปแล้ว กรุณาโหลดข้อมูลล่าสุด');
      const year = Number(req.body.fiscal_year ?? existing.fiscal_year);
      const quarter = Number(req.body.quarter ?? existing.quarter);
      validateFiscalPeriod(year, quarter);
      if (existing.replacement_for_id) await validateReplacement(tx, existing.replacement_for_id, year, quarter, req.user!);
      await ensureProjectPeriods(tx, year);
      return tx.projectForm.update({
      where: { id },
      data: updateData,
      include: {
        operating_budget: true,
        strategic_plan: true,
        department: true, user: { include: { major: true } },
      },
      });
    }, { timeout: 15000 });

    res.json({ project: serializeProject(project) });
  } catch (error) {
    next(error);
  }
});

// Retained as an explicit redirect for older clients; new reports require a fiscal period.
projectRouter.patch('/:id/progress', requireAuth, (_req, res) => {
  res.status(400).json({ message: 'กรุณาเลือกรอบปีและไตรมาส แล้วบันทึกที่ quarterly-reports' });
});

// Proposal review and cancellation preserve the project and all past reports.
projectRouter.post('/:id/cancellation-request', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new ProjectWorkflowError(400, 'รหัสโครงการไม่ถูกต้อง');
    await prisma.$transaction(tx => handleCancellation(tx, id, req.user!, req.body.action, req.body.reason));
    const project = await prisma.projectForm.findUniqueOrThrow({ where: { id }, include: { department: true, user: { include: { major: true } }, strategic_plan: true, operating_budget: true } });
    res.json({ project: serializeProject(project) });
  } catch (error) { next(error); }
});

projectRouter.post('/:id/review', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (req.body.action === 'cancel') throw new ProjectWorkflowError(400, 'กรุณาส่งคำขอยกเลิกโครงการเพื่อให้แอดมินพิจารณา');
    if (!Number.isInteger(id) || id <= 0) throw new ProjectWorkflowError(400, 'รหัสโครงการไม่ถูกต้อง');
    const project = await prisma.$transaction((tx) => reviewProject(tx, id, req.user!, req.body.action, req.body.comment));
    res.json({ project: serializeProject(project), message: 'บันทึกผลการพิจารณาโครงการแล้ว' });
  } catch (error) { next(error); }
});

projectRouter.delete('/:id', requireAuth, (_req, res) => {
  res.status(405).json({ message: 'กรุณาใช้การยกเลิกโครงการพร้อมเหตุผล เพื่อเก็บประวัติและรายงานเดิม' });
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
        department: true, user: { include: { major: true } },
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

projectRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ProjectWorkflowError) { res.status(error.statusCode).json({ message: error.message }); return; }
  next(error);
});
