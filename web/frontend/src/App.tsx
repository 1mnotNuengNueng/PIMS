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
import { DeptMatrixPage } from './pages/DeptMatrixPage';
import { ProjectsRegistryPage } from './pages/ProjectsRegistryPage';
import { ProposalFormPage } from './pages/ProposalFormPage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const TOKEN_KEY = 'pims_token';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState<User | null>(null);
  const [units, setUnits] = useState<UnitAccount[]>([]);
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
  const [activeStep, setActiveStep] = useState(0);

  // Dedicated Login Screen States
  const [loginRole, setLoginRole] = useState<'admin' | 'staff'>('admin');
  const [loginEmail, setLoginEmail] = useState('admin@pims.ac.th');
  const [loginPassword, setLoginPassword] = useState('password');

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
  const [progressRiskText, setProgressRiskText] = useState('');
  const [operationPlanText, setOperationPlanText] = useState('');

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
    return projects.filter((p) => p.status === 'draft' || p.status === 'resubmit').length;
  }, [projects]);

  // Count urgent revisions for current branch
  const branchResubmitCount = useMemo(() => {
    return currentDepartmentProjects.filter((p) => p.status === 'resubmit').length;
  }, [currentDepartmentProjects]);

  async function request<T>(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = response.status === 204 ? null : await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'เชื่อมต่อระบบไม่สำเร็จ');
    }

    return data as T;
  }

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

  function handleLogout() {
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

  // Load sample template for department staff
  function loadDepartmentSample() {
    const deptName = user?.major || 'ภาควิชาวิศวกรรมคอมพิวเตอร์';
    setForm({
      projectName: `โครงการพัฒนาทักษะวิศวกรรมและการบูรณาการองค์ความรู้ (${deptName})`,
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
      operationPlan: 'พ.ย. 2569 - เม.ย. 2570',
      progressRisk:
        'ต้องติดตามการจัดสรรตารางกิจกรรมไม่ให้กระทบต่อตารางการเรียนการสอนปกติ',
      expectedOutcomes:
        'นิสิตมีทักษะวิชาชีพสูงขึ้น และภาควิชามีผลงานเชิงประจักษ์ตามแผนยุทธศาสตร์',
      reviewComment: '',
    });
    setMessage(`โหลดตัวอย่างแบบเสนอโครงการของ "${deptName}" เรียบร้อยแล้ว`);
  }

  // Handle project submit
  async function handleProjectSubmit(submitStatus: 'draft' | 'resubmit') {
    setLoading(true);
    setError('');
    setMessage('');

    const payload = {
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
      operation_plan: form.operationPlan || form.methods.filter(Boolean).join('\n'),
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
          submitStatus === 'resubmit'
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
          submitStatus === 'resubmit'
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

    setForm({
      id: project.id,
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
      operationPlan: project.operation_plan || '',
      progressRisk: project.progress_risk || '',
      expectedOutcomes: project.expected_outcomes || '',
      reviewComment: project.review_comment || '',
    });

    setActiveTab('submit_form');
    setActiveStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProject(projectId: number) {
    if (!confirm('ยืนยันการลบโครงการนี้ออกจากระบบ?')) return;

    setLoading(true);
    setError('');

    try {
      await request(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      setMessage('ลบโครงการเรียบร้อยแล้ว');
      await refreshProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ลบข้อมูลไม่สำเร็จ');
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
      setReviewComment('');
      await refreshProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  // Handle Quarterly Progress Update by Branch Staff
  async function submitProgressUpdate() {
    if (!progressModalProject) return;
    setLoading(true);
    setError('');

    try {
      await request(`/api/projects/${progressModalProject.id}/progress`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          progress_risk: progressRiskText,
          operation_plan: operationPlanText,
        }),
      });

      setMessage(`อัปเดตรายงานความก้าวหน้าโครงการ "${progressModalProject.name}" เรียบร้อยแล้ว`);
      setProgressModalProject(null);
      await refreshProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'อัปเดตไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
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
        onFastLogin={handleFastLogin}
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
            setProgressRiskText={setProgressRiskText}
            setOperationPlanText={setOperationPlanText}
          />
        )}

        {/* VIEW 3: REVIEW & AUDIT DESK (ADMIN) */}
        {activeTab === 'approvals' && (
          <ApprovalsPage
            projects={projects}
            setWordPreviewProject={setWordPreviewProject}
            downloadWord={downloadWord}
            setReviewModalProject={setReviewModalProject}
            setReviewAction={setReviewAction}
            setReviewComment={setReviewComment}
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
            downloadWord={downloadWord}
            setProgressModalProject={setProgressModalProject}
            setProgressRiskText={setProgressRiskText}
            setOperationPlanText={setOperationPlanText}
            editProject={editProject}
            isApprover={isApprover}
            setReviewModalProject={setReviewModalProject}
            setReviewAction={setReviewAction}
            setReviewComment={setReviewComment}
            deleteProject={deleteProject}
          />
        )}
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
        project={progressModalProject}
        progressRiskText={progressRiskText}
        setProgressRiskText={setProgressRiskText}
        operationPlanText={operationPlanText}
        setOperationPlanText={setOperationPlanText}
        loading={loading}
        onClose={() => setProgressModalProject(null)}
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
