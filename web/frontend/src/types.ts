import { currentFiscalYear } from './utils/fiscalPeriod';

export type Role = 'admin' | 'staff' | 'super_admin';

export type User = {
  id: number;
  email: string;
  role: Role;
  majorId: number;
  major: string;
};

export type UnitAccount = {
  id: number;
  email: string;
  role: Role;
  majorId: number;
  majorName: string;
  isApprover: boolean;
};

export type RefItem = {
  id: number;
  name: string;
};

export type Metadata = {
  majors: RefItem[];
  strategicPlans: Array<RefItem & { strategic_details: string }>;
  operatingBudgets: Array<RefItem & { budget_detail: string }>;
};

export type Project = {
  cancellation_request_status?: 'pending' | 'approved' | 'rejected' | null;
  cancellation_request_reason?: string | null;
  cancellation_review_comment?: string | null;
  department_id?: number | null;
  department?: RefItem | null;
  latest_report?: {
    id: number; status: QuarterlyReport['status']; progress_percent: number; budget_spent: number;
    fiscal_year: number; quarter: number;
  } | null;
  fiscal_year: number | null;
  quarter: number | null;
  id: number;
  name: string;
  responsible_person: string;
  principles_rationale: string;
  objective: string;
  target_group: string;
  implementation_procedure: string;
  duration_of_operations: string;
  location: string;
  evaluation: string;
  expected_outcomes: string;
  strategic_goal: string;
  strategic_kpi: string;
  project_kpi: string;
  kpi_target: string;
  target_date: string;
  budget_amount: number;
  operation_plan: string;
  progress_risk: string;
  review_comment?: string;
  status: 'draft' | 'submitted' | 'approve' | 'cancel' | 'resubmit';
  submitted_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  replacement_for_id?: number | null;
  replacement_for?: { id: number; name: string } | null;
  replacement_projects?: Array<{ id: number; name: string; fiscal_year: number | null; quarter: number | null }>;
  strategic_plan_id: number;
  operating_budget_id: number;
  update_at: string;
  create_by: number;
  strategic_plan?: RefItem;
  operating_budget?: RefItem;
  user?: {
    Email: string;
    Major_id: number;
    major?: { name: string };
  };
};

export type Dashboard = {
  total: number;
  approved: number;
  resubmit: number;
  drafts: number;
  canceled: number;
  kpiTotal: number;
  budgetTotal: number;
  approvedBudgetTotal: number;
  byStrategy: Array<{ strategic_plan_id: number; name: string; count: number; budget: number }>;
  byBudget: Array<{ id: number; name: string; count: number; amount: number }>;
  byDepartment: Array<{ majorId: number; name: string; count: number; approved: number; resubmit: number; budget: number }>;
};

export type FiscalPeriod = {
  id: number;
  quarter: number;
  start_date: string;
  end_date: string;
  report_due_date: string;
  fiscal_year: { id: number; year: number };
};

export type QuarterlyReport = {
  id: number;
  project_id: number;
  fiscal_period_id: number;
  fiscal_period: FiscalPeriod;
  results: string;
  kpi_results: string;
  budget_spent: number;
  progress_percent: number;
  problems: string | null;
  next_steps: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'resubmit';
  submitted_at: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  is_demo: boolean;
  author: { id: number; Email: string };
  reviewer: { id: number; Email: string } | null;
};

export type ProjectReviewData = { project: Project; reports: QuarterlyReport[]; periods: FiscalPeriod[] };

export type ProjectForm = {
  replacementForId?: number;
  fiscalYear: string;
  quarter: string;
  id?: number;
  projectName: string;
  strategicPlanId: string;
  operatingBudgetId: string;
  department: string;
  targetGroup?: string;
  owner: string;
  ownerRole: string;
  status: Project['status'];
  startDate: string;
  endDate: string;
  location: string;
  rationale: string;
  objectives: string[];
  methods: string[];
  kpi: string;
  kpiTarget: string;
  strategicGoal: string;
  strategicKpi: string;
  budgetAmount: string;
  operationPlan: string;
  operationStartDate: string;
  operationEndDate: string;
  progressRisk: string;
  expectedOutcomes: string;
  reviewComment?: string;
};

export const statusLabels: Record<Project['status'], string> = {
  draft: 'ฉบับร่าง / ยังไม่ส่ง',
  submitted: 'ส่งข้อเสนอแล้ว / รอพิจารณา',
  approve: 'อนุมัติแล้ว',
  resubmit: 'ส่งกลับเพื่อแก้ไข',
  cancel: 'ยกเลิกโครงการ',
};

export const statusColors: Record<Project['status'], string> = {
  draft: 'gray',
  submitted: 'amber',
  approve: 'green',
  resubmit: 'orange',
  cancel: 'red',
};

export const steps = [
  'ข้อมูลพื้นฐานโครงการ',
  'รายละเอียดและขั้นตอน',
  'ตัวชี้วัดและแผนกลยุทธ์',
  'งบประมาณและการดำเนินงาน',
  'ตรวจสอบและยืนยัน',
];

export const emptyForm: ProjectForm = {
  fiscalYear: String(currentFiscalYear()),
  quarter: '1',
  projectName: '',
  strategicPlanId: '',
  operatingBudgetId: '',
  department: '',
  targetGroup: '',
  owner: '',
  ownerRole: '',
  status: 'draft',
  startDate: '',
  endDate: '',
  location: '',
  rationale: '',
  objectives: [''],
  methods: [''],
  kpi: '',
  kpiTarget: '',
  strategicGoal: '',
  strategicKpi: '',
  budgetAmount: '',
  operationPlan: '',
  operationStartDate: '',
  operationEndDate: '',
  progressRisk: '',
  expectedOutcomes: '',
  reviewComment: '',
};

export const emptyDashboard: Dashboard = {
  total: 0,
  approved: 0,
  resubmit: 0,
  drafts: 0,
  canceled: 0,
  kpiTotal: 0,
  budgetTotal: 0,
  approvedBudgetTotal: 0,
  byStrategy: [],
  byBudget: [],
  byDepartment: [],
};
