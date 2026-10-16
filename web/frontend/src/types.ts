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
  status: 'draft' | 'approve' | 'cancel' | 'resubmit';
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

export type ProjectForm = {
  id?: number;
  projectName: string;
  strategicPlanId: string;
  operatingBudgetId: string;
  department: string;
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
  targetDate: string;
  budgetAmount: string;
  operationPlan: string;
  operationStartDate: string;
  operationEndDate: string;
  progressRisk: string;
  expectedOutcomes: string;
  reviewComment?: string;
};

export const statusLabels: Record<Project['status'], string> = {
  draft: 'ฉบับร่าง / รอพิจารณา',
  approve: 'อนุมัติแล้ว',
  resubmit: 'ส่งกลับเพื่อแก้ไข',
  cancel: 'ยกเลิกโครงการ',
};

export const statusColors: Record<Project['status'], string> = {
  draft: 'blue',
  approve: 'green',
  resubmit: 'amber',
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
  projectName: '',
  strategicPlanId: '',
  operatingBudgetId: '',
  department: '',
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
  targetDate: '',
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
