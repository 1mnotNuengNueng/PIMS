import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import './PersonaStyles.css';

// Types and Defaults
import type {
  User,
  UnitAccount,
  Metadata,
  Project,
  Dashboard,
  ProjectForm,
} from './types';
import { emptyForm, emptyDashboard } from './types';

// Layout & Modal Components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WordPreviewModal } from './components/WordPreviewModal';
import { AuditModal } from './components/AuditModal';
import { ProgressModal } from './components/ProgressModal';
import { UnitSwitchModal } from './components/UnitSwitchModal';

// Modular Page Views
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ProjectReviewPage } from './pages/ProjectReviewPage';
import { reviewProjectId } from './utils/quarterlyReview';
import { DeptMatrixPage } from './pages/DeptMatrixPage';
import { ProjectsRegistryPage } from './pages/ProjectsRegistryPage';
import { ProposalFormPage } from './pages/ProposalFormPage';
import { UserManagementPage } from './pages/UserManagementPage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const TOKEN_KEY = 'pims_token';
const OPERATION_DATE_RANGE = /^(\d{4}-\d{2}-\d{2})\s*(?:-|ถึง)\s*(\d{4}-\d{2}-\d{2})$/;

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || 'เชื่อมต่อระบบไม่สำเร็จ');
  return data as T;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState<User | null>(null);
  const [units, setUnits] = useState<UnitAccount[]>([]);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({
    majors: [],
    strategicPlans: [],
    operatingBudgets: [],
  });
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyForm);

  // System Persona: 'admin' (ฝ่ายพัฒนาองค์กร / ตรวจงาน) OR 'staff' (เจ้าหน้าที่สาขาวิชา / หน่วยงาน)
  const [personaMode, setPersonaMode] = useState<'admin' | 'staff'>('admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [detailProjectId, setDetailProjectId] = useState(() => reviewProjectId(window.location.hash));
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      setDetailProjectId(reviewProjectId(window.location.hash));
      if (window.location.hash === '#/approvals') setActiveTab('approvals');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function openProjectReview(project: Project) {
    window.location.hash = `/admin/projects/${project.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const [activeStep, setActiveStep] = useState(0);

  // Dedicated Login Screen States
  const [loginRole, setLoginRole] = useState<'admin' | 'staff'>('admin');
  const [loginEmail, setLoginEmail] = useState('admin@pims.ac.th');
  const [loginPassword, setLoginPassword] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', majorName: '' });

  // Word Preview Modal State
  const [wordPreviewProject, setWordPreviewProject] = useState<Project | null>(null);

  // Review (Approve & Resubmit) Modal State
  const [reviewModalProject, setReviewModalProject] = useState<Project | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'resubmit' | 'cancel'>('approve');
  const [reviewComment, setReviewComment] = useState('');

  // Progress Update Modal State (For department staff)
  const [progressModalProject, setProgressModalProject] = useState<Project | null>(null);

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const isAdmin = useMemo(() => {
    return personaMode === 'admin' || user?.role === 'admin' || user?.role === 'super_admin';
  }, [personaMode, user]);

  const isApprover = isAdmin;

  // Filter projects by current department if in staff mode
  const currentDepartmentProjects = useMemo(() => {
    if (personaMode === 'admin') return projects;
    if (!user) return projects;
    return projects.filter(
      (p) => p.user?.Major_id === user.majorId || p.target_group === user.major,
    );
  }, [personaMode, user, projects]);

  // Count pending review for admin
  const pendingReviewCount = useMemo(() => {
    return projects.filter((p) => p.status === 'submitted').length;
  }, [projects]);

  // Count urgent revisions for current branch
  const branchResubmitCount = useMemo(() => {
    return currentDepartmentProjects.filter((p) => p.status === 'resubmit').length;
  }, [currentDepartmentProjects]);

  async function loadAppData(activeToken = token) {
    if (!activeToken) {
      try {
        const unitList = await request<{ units: UnitAccount[] }>('/api/auth/units');
        setUnits(unitList.units);
      } catch {}
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`,
      };

      const [me, unitList, refs, projectData, dashboardData] = await Promise.all([
        request<User>('/api/auth/me', { headers }).catch(() => null),
        request<{ units: UnitAccount[] }>('/api/auth/units').catch(() => ({ units: [] })),
        request<Metadata>('/api/metadata', { headers }).catch(() => ({
          majors: [],
          strategicPlans: [],
          operatingBudgets: [],
        })),
        request<{ projects: Project[] }>('/api/projects', { headers }).catch(() => ({
          projects: [],
        })),
        request<Dashboard>('/api/dashboard', { headers }).catch(() => emptyDashboard),
      ]);

      if (me) {
        setUser(me);
        setPersonaMode(me.role === 'admin' || me.role === 'super_admin' ? 'admin' : 'staff');
      } else {
        setUser(null);
        setToken('');
        localStorage.removeItem(TOKEN_KEY);
      }
      setUnits(unitList.units);
      setMetadata(refs);
      setProjects(projectData.projects);
      setDashboard(dashboardData);

      setForm((current) => ({
        ...current,
        strategicPlanId: current.strategicPlanId || String(refs.strategicPlans[0]?.id || ''),
        operatingBudgetId:
          current.operatingBudgetId || String(refs.operatingBudgets[0]?.id || ''),
        department: current.department || me?.major || '',
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Always fetch public units list for login picker
    request<{ units: UnitAccount[] }>('/api/auth/units')
      .then((res) => setUnits(res.units))
      .catch(() => {});

    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      loadAppData(saved);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'users' || !token || !isAdmin) return;
    let active = true;
    fetch(`${API_BASE}/api/users`, { headers: authHeaders })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'โหลดบัญชีผู้ใช้ไม่สำเร็จ');
        return data as { users: User[] };
      })
      .then((data) => { if (active) setManagedUsers(data.users); })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'โหลดบัญชีผู้ใช้ไม่สำเร็จ');
      });
    return () => { active = false; };
  }, [activeTab, token, isAdmin, authHeaders]);

  function handleLogout() {
    window.location.hash = '';
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setActiveTab('dashboard');
    setMessage('ออกจากระบบเรียบร้อยแล้ว');
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      const isAdm = data.user.role === 'admin' || data.user.role === 'super_admin';
      setPersonaMode(isAdm ? 'admin' : 'staff');
      setActiveTab('dashboard');
      setMessage(
        `เข้าสู่ระบบสำเร็จ: ${data.user.major} (${isAdm ? 'ฝ่ายพัฒนาองค์กร' : 'สาขาวิชา'})`,
      );
      await loadAppData(data.token);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPasswordReset(email: string): Promise<boolean> {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await request<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setMessage(data.message);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ขอรหัส OTP ไม่สำเร็จ');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(email: string, otp: string, password: string): Promise<boolean> {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await request<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      setLoginEmail(email);
      setMessage(data.message);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleFastLogin(targetEmail: string) {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await request<{ token: string; user: User }>('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      const isAdm = data.user.role === 'admin' || data.user.role === 'super_admin';
      setPersonaMode(isAdm ? 'admin' : 'staff');
      setActiveTab('dashboard');
      setMessage(
        `เข้าสู่ระบบสำเร็จ: ${data.user.major} (${isAdm ? 'ฝ่ายพัฒนาองค์กร' : 'สาขาวิชา'})`,
      );
      await loadAppData(data.token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      const data = await request<{ token: string; user: User }>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setPersonaMode(
        data.user.role === 'admin' || data.user.role === 'super_admin' ? 'admin' : 'staff',
      );
      setMessage(authMode === 'login' ? 'เข้าสู่ระบบสำเร็จ' : 'สมัครใช้งานสำเร็จ');
      setShowAuthModal(false);
      await loadAppData(data.token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function refreshProjects() {
    try {
      const [projectData, dashboardData] = await Promise.all([
        request<{ projects: Project[] }>('/api/projects', { headers: authHeaders }),
        request<Dashboard>('/api/dashboard', { headers: authHeaders }),
      ]);
      setProjects(projectData.projects);
      setDashboard(dashboardData);
    } catch (cause) {
      console.error(cause);
    }
  }

  async function createManagedUser(input: { email: string; password: string; majorId: number }): Promise<boolean> {
    setLoading(true);
    setError('');
    try {
      await request('/api/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(input),
      });
      const data = await request<{ users: User[] }>('/api/users', { headers: authHeaders });
      setManagedUsers(data.users);
      setMessage('สร้างบัญชีผู้ใช้เรียบร้อยแล้ว');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'สร้างบัญชีผู้ใช้ไม่สำเร็จ');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Load sample template for department staff
  function loadDepartmentSample() {
    const deptName = user?.major || 'ภาควิชาวิศวกรรมคอมพิวเตอร์';
    setForm({
      projectName: `โครงการพัฒนาทักษะวิศวกรรมและการบูรณาการองค์ความรู้ (${deptName})`,
      ...(form.replacementForId ? { replacementForId: form.replacementForId } : {}),
      fiscalYear: form.fiscalYear || '2570',
      quarter: form.quarter || '1',
      strategicPlanId: String(metadata.strategicPlans[0]?.id || 1),
      operatingBudgetId: String(metadata.operatingBudgets[1]?.id || 2),
      department: deptName,
      owner: `หัวหน้าโครงการ ประจำ${deptName}`,
      ownerRole: 'อาจารย์ประจำภาควิชา / ผู้รับผิดชอบโครงการ',
      status: 'draft',
      startDate: '2569-11-01',
      endDate: '2570-04-30',
      location: 'คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์',
      rationale:
        'เพื่อตอบสนองต่อแผนปฏิบัติการประจำปีของคณะวิศวกรรมศาสตร์ ในการยกระดับสมรรถนะนิสิต คณาจารย์ และการบริการวิชาการสู่อุตสาหกรรมเป้าหมาย',
      objectives: [
        'เพื่อพัฒนาศักยภาพนิสิตให้มีทักษะสอดคล้องกับความต้องการของภาคอุตสาหกรรม',
        'เพื่อสร้างผลงานนวัตกรรมและโครงงานสหกิจศึกษาที่นำไปใช้ประโยชน์ได้จริง',
        'เพื่อส่งเสริมเครือข่ายความร่วมมือทางวิชาการและวิจัยร่วมกับองค์กรภายนอก',
      ],
      methods: [
        'สำรวจความต้องการและจัดทำแผนการดำเนินงานโครงการ',
        'จัดอบรมเชิงปฏิบัติการและสัมมนาแลกเปลี่ยนเรียนรู้กับผู้เชี่ยวชาญ',
        'ติดตามการดำเนินโครงงานและประเมินผลสัมฤทธิ์ตามตัวชี้วัด',
        'จัดทำรายงานสรุปผลการดำเนินงานและข้อเสนอแนะในการพัฒนาอย่างต่อเนื่อง',
      ],
      kpi: 'ร้อยละความพึงพอใจของผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 85',
      kpiTarget: 'จำนวนผู้เข้าร่วมไม่น้อยกว่า 60 คน และผ่านเกณฑ์ประเมิน 100%',
      strategicGoal: 'สร้างผู้เชี่ยวชาญสหวิศวกรรมสู่สากล',
      strategicKpi: 'ร้อยละของนิสิตที่มีสมรรถนะตามมาตรฐานวิชาชีพ',
      targetDate: '30 เม.ย. 2570',
      budgetAmount: '150000',
      operationPlan: '',
      operationStartDate: '2026-11-01',
      operationEndDate: '2027-04-30',
      progressRisk:
        'ต้องติดตามการจัดสรรตารางกิจกรรมไม่ให้กระทบต่อตารางการเรียนการสอนปกติ',
      expectedOutcomes:
        'นิสิตมีทักษะวิชาชีพสูงขึ้น และภาควิชามีผลงานเชิงประจักษ์ตามแผนยุทธศาสตร์',
      reviewComment: '',
    });
    setMessage(`โหลดตัวอย่างแบบเสนอโครงการของ "${deptName}" เรียบร้อยแล้ว`);
  }

  // Handle project submit
  async function handleProjectSubmit(submitStatus: 'draft' | 'submitted') {
    setLoading(true);
    setError('');
    setMessage('');

    const hasOperationStart = Boolean(form.operationStartDate);
    const hasOperationEnd = Boolean(form.operationEndDate);
    if (hasOperationStart !== hasOperationEnd) {
      setError('กรุณาเลือกทั้งวันเริ่มต้นและวันสิ้นสุดของแผนการดำเนินการ');
      setLoading(false);
      return;
    }
    if (hasOperationStart && form.operationEndDate < form.operationStartDate) {
      setError('วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น');
      setLoading(false);
      return;
    }

    if (!form.fiscalYear || !form.quarter) {
      setError('กรุณาเลือกปีงบประมาณและไตรมาสที่จะดำเนินโครงการ');
      setActiveStep(0);
      setLoading(false);
      return;
    }

    const payload = {
      replacement_for_id: form.replacementForId ?? null,
      fiscal_year: Number(form.fiscalYear),
      quarter: Number(form.quarter),
      name: form.projectName,
      strategic_plan_id: Number(form.strategicPlanId),
      responsible_person: form.owner,
      principles_rationale: form.rationale,
      objective: form.objectives.filter(Boolean).join('\n'),
      target_group: form.department,
      implementation_procedure: form.methods.filter(Boolean).join('\n'),
      duration_of_operations: `${form.startDate} - ${form.endDate}`,
      location: form.location,
      evaluation: form.kpi,
      expected_outcomes: form.expectedOutcomes || form.ownerRole,
      strategic_goal: form.strategicGoal,
      strategic_kpi: form.strategicKpi,
      project_kpi: form.kpi,
      kpi_target: form.kpiTarget,
      target_date: form.targetDate || form.endDate,
      budget_amount: Number(form.budgetAmount) || 0,
      operation_plan: hasOperationStart
        ? `${form.operationStartDate} ถึง ${form.operationEndDate}`
        : form.operationPlan || form.methods.filter(Boolean).join('\n'),
      progress_risk: form.progressRisk,
      review_comment: form.reviewComment || '',
      operating_budget_id: Number(form.operatingBudgetId),
      status: submitStatus,
    };

    try {
      if (form.id) {
        await request(`/api/projects/${form.id}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        setMessage(
          submitStatus === 'submitted'
            ? 'ส่งโครงการเพื่อรอพิจารณาอนุมัติเรียบร้อยแล้ว'
            : 'บันทึกฉบับร่างโครงการเรียบร้อยแล้ว',
        );
      } else {
        await request('/api/projects', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        setMessage(
          submitStatus === 'submitted'
            ? 'ยื่นแบบเสนอโครงการเพื่อขออนุมัติเรียบร้อยแล้ว'
            : 'บันทึกโครงการฉบับร่างเรียบร้อยแล้ว',
        );
      }

      setForm({
        ...emptyForm,
        strategicPlanId: String(metadata.strategicPlans[0]?.id || ''),
        operatingBudgetId: String(metadata.operatingBudgets[0]?.id || ''),
        department: user?.major || '',
      });
      setActiveStep(0);
      await refreshProjects();
      setActiveTab(personaMode === 'admin' ? 'projects' : 'my_projects');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function editProject(project: Project) {
    const [startDate = '', endDate = ''] = (project.duration_of_operations || '')
      .split(' - ')
      .map((item) => item.trim());
    const operationDateRange = (project.operation_plan || '').match(OPERATION_DATE_RANGE);

    setForm({
      id: project.id,
      ...(project.replacement_for_id ? { replacementForId: project.replacement_for_id } : {}),
      fiscalYear: project.fiscal_year ? String(project.fiscal_year) : '',
      quarter: project.quarter ? String(project.quarter) : '',
      projectName: project.name,
      strategicPlanId: String(project.strategic_plan_id),
      operatingBudgetId: String(project.operating_budget_id),
      department: project.target_group,
      owner: project.responsible_person,
      ownerRole: project.expected_outcomes,
      status: project.status,
      startDate,
      endDate,
      location: project.location,
      rationale: project.principles_rationale,
      objectives: project.objective.split('\n').filter(Boolean).length
        ? project.objective.split('\n')
        : [''],
      methods: project.implementation_procedure.split('\n').filter(Boolean).length
        ? project.implementation_procedure.split('\n')
        : [''],
      kpi: project.project_kpi || project.evaluation,
      kpiTarget: project.kpi_target || '',
      strategicGoal: project.strategic_goal || '',
      strategicKpi: project.strategic_kpi || '',
      targetDate: project.target_date || '',
      budgetAmount: String(project.budget_amount || ''),
      operationPlan: operationDateRange ? '' : project.operation_plan || '',
      operationStartDate: operationDateRange?.[1] || '',
      operationEndDate: operationDateRange?.[2] || '',
      progressRisk: project.progress_risk || '',
      expectedOutcomes: project.expected_outcomes || '',
      reviewComment: project.review_comment || '',
    });

    setActiveTab('submit_form');
    setActiveStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProject(projectId: number) {
    const project = projects.find((item) => item.id === projectId);
    const reason = prompt(`เหตุผลการยกเลิกโครงการ${project ? ` “${project.name}”` : ''} (เก็บข้อมูลเดิมไว้)`);
    if (reason === null) return;
    if (!reason.trim()) { setError('กรุณาระบุเหตุผลการยกเลิก'); return; }

    setLoading(true);
    setError('');

    try {
      await request(`/api/projects/${projectId}/review`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action: 'cancel', comment: reason.trim() }),
      });
      setMessage('ยกเลิกโครงการเรียบร้อยแล้ว ข้อมูลยังอยู่ในระบบ');
      await refreshProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ยกเลิกโครงการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  // Handle Review (Approve & Resubmit) by Admin / OD
  async function submitReview() {
    if (!reviewModalProject) return;
    setLoading(true);
    setError('');

    try {
      await request(`/api/projects/${reviewModalProject.id}/review`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action: reviewAction,
          comment: reviewComment,
        }),
      });

      setMessage(
        reviewAction === 'approve'
          ? `อนุมัติโครงการ "${reviewModalProject.name}" เรียบร้อยแล้ว`
          : reviewAction === 'resubmit'
            ? `ส่งกลับโครงการ "${reviewModalProject.name}" เพื่อให้สาขาแก้ไขเรียบร้อยแล้ว`
            : `ยกเลิกโครงการเรียบร้อยแล้ว`,
      );

      setReviewModalProject(null);
      setDetailRefreshKey((value) => value + 1);
      setReviewComment('');
      await refreshProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  // Quarterly modal saves the selected period, then refreshes the parent lists.
  async function submitProgressUpdate() {
    setProgressModalProject(null);
    setMessage('บันทึกรายงานตามรอบไตรมาสแล้ว');
    await refreshProjects();
  }

  function startReplacement(project: Project) {
    const nextQuarter = project.quarter && project.quarter < 4 ? project.quarter + 1 : 1;
    const nextYear = (project.fiscal_year || Number(emptyForm.fiscalYear)) + (project.quarter === 4 ? 1 : 0);
    setForm({ ...emptyForm, replacementForId: project.id, fiscalYear: String(nextYear), quarter: String(nextQuarter),
      department: user?.major || '', strategicPlanId: String(metadata.strategicPlans[0]?.id || ''),
      operatingBudgetId: String(metadata.operatingBudgets[0]?.id || '') });
    setActiveStep(0);
    setActiveTab('submit_form');
    window.location.hash = '';
  }

  function downloadWord(projectId: number) {
    window.open(`${API_BASE}/api/projects/${projectId}/export-word`, '_blank');
  }

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const sourceList = personaMode === 'staff' ? currentDepartmentProjects : projects;
    return sourceList.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.responsible_person.toLowerCase().includes(search.toLowerCase()) ||
        p.target_group.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchStrategy =
        strategyFilter === 'all' || String(p.strategic_plan_id) === strategyFilter;

      return matchSearch && matchStatus && matchStrategy;
    });
  }, [personaMode, currentDepartmentProjects, projects, search, statusFilter, strategyFilter]);

  // --------------------------------------------------------------------------
  // 1. DEDICATED AUTHENTICATION SCREEN (WHEN NOT LOGGED IN)
  // --------------------------------------------------------------------------
  if (!user) {
    return (
      <LoginPage
        loginRole={loginRole}
        setLoginRole={setLoginRole}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        error={error}
        setError={setError}
        message={message}
        setMessage={setMessage}
        loading={loading}
        units={units}
        onLoginSubmit={handleLoginSubmit}
        onRequestPasswordReset={handleRequestPasswordReset}
        onResetPassword={handleResetPassword}
      />
    );
  }

  // --------------------------------------------------------------------------
  // 2. MAIN APPLICATION WORKSPACE (WHEN LOGGED IN)
  // --------------------------------------------------------------------------
  return (
    <div className="app-shell">
      {/* ---------------- SIDEBAR NAVIGATION ---------------- */}
      <Sidebar
        user={user}
        isAdmin={isAdmin}
        activeTab={detailProjectId ? 'approvals' : activeTab}
        setActiveTab={(tab) => { window.location.hash = ''; setActiveTab(tab); }}
        pendingReviewCount={pendingReviewCount}
        projectsCount={projects.length}
        branchProjectsCount={currentDepartmentProjects.length}
        branchResubmitCount={branchResubmitCount}
        onLogout={handleLogout}
        onOpenUnitSwitch={() => setShowAuthModal(true)}
        form={form}
        setForm={setForm}
        metadata={metadata}
      />

      {/* ---------------- MAIN WORKSPACE ---------------- */}
      <main className="workspace">
        {/* ROLE-AWARE TOPBAR */}
        <Topbar
          search={search}
          setSearch={setSearch}
          user={user}
          isAdmin={isAdmin}
          onOpenUnitSwitch={() => setShowAuthModal(true)}
          pendingReviewCount={pendingReviewCount}
        />

        {/* FEEDBACK BANNERS */}
        {message && (
          <div className="alert-banner alert-success animate-fade">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}>✕</button>
          </div>
        )}
        {error && (
          <div className="alert-banner alert-danger animate-fade">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {detailProjectId ? <ProjectReviewPage
          key={detailProjectId}
          projectId={detailProjectId}
          request={request}
          authHeaders={authHeaders}
          onBack={() => { window.location.hash = '/approvals'; }}
          onWordPreview={setWordPreviewProject}
          onProjectReview={(project) => {
            setReviewModalProject(project);
            setReviewAction(project.status === 'submitted' ? 'approve' : 'cancel');
            setReviewComment('');
          }}
          onCreateReplacement={startReplacement}
          onReportsChanged={refreshProjects}
          refreshKey={detailRefreshKey}
        /> : <>
        {/* VIEW 1: EXECUTIVE FACULTY OVERVIEW (ADMIN MODE) */}
        {activeTab === 'dashboard' && personaMode === 'admin' && (
          <AdminDashboard
            dashboard={dashboard}
            setActiveTab={setActiveTab}
          />
        )}

        {/* VIEW 2: DEPARTMENT HUB (STAFF MODE) */}
        {activeTab === 'dashboard' && personaMode === 'staff' && (
          <StaffDashboard
            user={user}
            currentDepartmentProjects={currentDepartmentProjects}
            branchResubmitCount={branchResubmitCount}
            setActiveTab={setActiveTab}
            loadDepartmentSample={loadDepartmentSample}
            editProject={editProject}
            setWordPreviewProject={setWordPreviewProject}
            setProgressModalProject={setProgressModalProject}
          />
        )}

        {/* VIEW 3: REVIEW & AUDIT DESK (ADMIN) */}
        {activeTab === 'approvals' && (
          <ApprovalsPage
            projects={projects}
            setWordPreviewProject={setWordPreviewProject}
            onOpenDetails={openProjectReview}
          />
        )}

        {/* VIEW 4: DEPARTMENT MATRIX (ADMIN) */}
        {activeTab === 'dept_matrix' && (
          <DeptMatrixPage
            dashboard={dashboard}
            setSearch={setSearch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'users' && isAdmin && (
          <UserManagementPage
            users={managedUsers}
            departments={metadata.majors}
            loading={loading}
            onCreate={createManagedUser}
          />
        )}

        {/* VIEW 5: SUBMIT / EDIT PROJECT FORM (STAFF & ADMIN) */}
        {activeTab === 'submit_form' && (
          <ProposalFormPage
            form={form}
            setForm={setForm}
            metadata={metadata}
            user={user}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            loadDepartmentSample={loadDepartmentSample}
            handleProjectSubmit={handleProjectSubmit}
            loading={loading}
          />
        )}

        {/* VIEW 6: PROJECTS REGISTRY (FACULTY OR BRANCH) */}
        {(activeTab === 'projects' || activeTab === 'my_projects') && (
          <ProjectsRegistryPage
            personaMode={personaMode}
            user={user}
            filteredProjects={filteredProjects}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            strategyFilter={strategyFilter}
            setStrategyFilter={setStrategyFilter}
            metadata={metadata}
            setForm={setForm}
            setActiveTab={setActiveTab}
            setActiveStep={setActiveStep}
            setWordPreviewProject={setWordPreviewProject}
            setProgressModalProject={setProgressModalProject}
            editProject={editProject}
            isApprover={isApprover}
            setReviewModalProject={openProjectReview}
            setReviewAction={setReviewAction}
            setReviewComment={setReviewComment}
            onCreateReplacement={startReplacement}
            deleteProject={deleteProject}
          />
        )}
        </>}
      </main>

      {/* ---------------- MODALS ---------------- */}
      {/* 1. WORD FORM A4 PREVIEW MODAL */}
      <WordPreviewModal
        project={wordPreviewProject}
        onClose={() => setWordPreviewProject(null)}
        onDownloadWord={downloadWord}
      />

      {/* 2. AUDIT & APPROVAL MODAL (ADMIN) */}
      <AuditModal
        project={reviewModalProject}
        reviewAction={reviewAction}
        setReviewAction={setReviewAction}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        loading={loading}
        onClose={() => setReviewModalProject(null)}
        onSubmitReview={submitReview}
      />

      {/* 3. PROGRESS UPDATE MODAL (STAFF) */}
      <ProgressModal
        key={progressModalProject?.id || 'closed'}
        project={progressModalProject}
        onClose={() => setProgressModalProject(null)}
        request={request}
        authHeaders={authHeaders}
        onSubmitProgressUpdate={submitProgressUpdate}
      />

      {/* 4. AUTH & 1-CREDENTIAL SWITCH MODAL */}
      <UnitSwitchModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        units={units}
        user={user}
        onFastLogin={handleFastLogin}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        onAuthSubmit={handleAuthSubmit}
        loading={loading}
      />
    </div>
  );
}

export default App;
