import React from 'react';
import type { User, ProjectForm, Metadata } from '../types';
import { steps, emptyForm } from '../types';
import { formatMoney } from '../utils/format';
import { quarters, fiscalYearOptions, fiscalPeriodLabel } from '../utils/fiscalPeriod';
import {
  FileTextIcon,
  AlertCircleIcon,
  PlusIcon,
  SendIcon,
} from '../components/Icons';

interface ProposalFormPageProps {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  metadata: Metadata;
  user: User | null;
  activeStep: number;
  setActiveStep: (step: number | ((prev: number) => number)) => void;
  loadDepartmentSample: () => void;
  handleProjectSubmit: (targetStatus: 'draft' | 'submitted') => void;
  loading: boolean;
}

export const ProposalFormPage: React.FC<ProposalFormPageProps> = ({
  form,
  setForm,
  metadata,
  user,
  activeStep,
  setActiveStep,
  loadDepartmentSample,
  handleProjectSubmit,
  loading,
}) => {
  const updateField = (field: keyof ProjectForm, value: unknown) => {
    setForm((curr) => ({ ...curr, [field]: value }));
  };

  const updateList = (field: 'objectives' | 'methods', index: number, value: string) => {
    setForm((curr) => {
      const list = [...curr[field]];
      list[index] = value;
      return { ...curr, [field]: list };
    });
  };

  const addListItem = (field: 'objectives' | 'methods') => {
    setForm((curr) => ({ ...curr, [field]: [...curr[field], ''] }));
  };

  const removeListItem = (field: 'objectives' | 'methods', index: number) => {
    setForm((curr) => {
      const list = curr[field].filter((_, i) => i !== index);
      return { ...curr, [field]: list.length ? list : [''] };
    });
  };

  // Completeness Calculation
  const requiredFields: Array<keyof ProjectForm> = [
    'fiscalYear',
    'quarter',
    'projectName',
    'strategicPlanId',
    'operatingBudgetId',
    'department',
    'owner',
    'startDate',
    'endDate',
    'rationale',
    'kpi',
    'budgetAmount',
  ];

  const completedRequired = requiredFields.filter((f) => Boolean(form[f])).length;
  const progressPercent = Math.round((completedRequired / requiredFields.length) * 100);

  return (
    <div className="view-container animate-fade">
      <div className="form-hero-card">
        <div>
          <span className="form-badge">OFFICIAL PROPOSAL SUBMISSION</span>
          <h1>
            {form.id ? 'แก้ไขข้อมูลแบบเสนอโครงการ' : 'ยื่นแบบเสนอโครงการใหม่ตามแผนปฏิบัติการ'}
          </h1>
          <p>
            กรอกข้อมูลตามระเบียบงานสารบรรณและแบบฟอร์มทางการ คณะวิศวกรรมศาสตร์ กำแพงแสน
          </p>
        </div>

        <div className="form-hero-actions">
          <button
            type="button"
            className="btn-sample-fill"
            onClick={loadDepartmentSample}
          >
            <FileTextIcon size={14} />
            <span>โหลดตัวอย่างโครงการของสาขา</span>
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setForm({
                ...emptyForm,
                strategicPlanId: String(metadata.strategicPlans[0]?.id || ''),
                operatingBudgetId: String(metadata.operatingBudgets[0]?.id || ''),
                department: user?.major || '',
              });
              setActiveStep(0);
            }}
          >
            ล้างข้อมูล
          </button>
        </div>
      </div>

      {form.replacementForId && <p className="quarter-review-notice">โครงการใหม่ทดแทนโครงการเดิม #{form.replacementForId} — ประวัติโครงการเดิมจะยังอยู่</p>}
      <p className="quarter-review-notice">รอบเริ่มต้นเป็นการส่งข้อเสนอโครงการ หลังอนุมัติแล้วจึงรายงานความคืบหน้าในไตรมาสถัดไป</p>
      {/* If Resubmitted notice */}
      {form.reviewComment && form.status === 'resubmit' && (
        <div className="resubmit-callout animate-fade">
          <div className="callout-icon">
            <AlertCircleIcon size={22} />
          </div>
          <div className="callout-body">
            <strong>โครงการนี้ถูกฝ่ายพัฒนาองค์กรส่งกลับเพื่อให้ปรับปรุงแก้ไข</strong>
            <p className="callout-comment">
              <b>ข้อเสนอแนะที่ต้องแก้ไข:</b> {form.reviewComment}
            </p>
            <span>
              เมื่อท่านปรับปรุงข้อมูลครบถ้วนแล้ว ให้กดปุ่ม <b>"ส่งโครงการอีกครั้ง (Resubmit)"</b> ด้านล่างสุด
            </span>
          </div>
        </div>
      )}

      {/* Modern Stepper */}
      <ol className="stepper-bar">
        {steps.map((step, idx) => (
          <li
            key={step}
            className={`stepper-node ${idx === activeStep ? 'active' : idx < activeStep ? 'completed' : ''}`}
            onClick={() => setActiveStep(idx)}
          >
            <span className="node-num">{idx + 1}</span>
            <span className="node-text">{step}</span>
          </li>
        ))}
      </ol>

      {/* Stepper Form Body */}
      <form
        className="stepper-form-card"
        onSubmit={(e) => {
          e.preventDefault();
          handleProjectSubmit('submitted');
        }}
      >
        {/* STEP 1: Basic Info */}
        {activeStep === 0 && (
          <div className="step-pane animate-fade">
            <h2 className="step-pane-title">1. ข้อมูลพื้นฐานโครงการ</h2>

            <div className="input-grid two-cols">
              <label className="field-block">
                <span className="field-label required">ปีงบประมาณ (พ.ศ.)</span>
                <select required value={form.fiscalYear} onChange={(e) => updateField('fiscalYear', e.target.value)}>
                  <option value="">เลือกปีงบประมาณ</option>
                  {fiscalYearOptions(form.fiscalYear ? [Number(form.fiscalYear)] : []).map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                {form.fiscalYear && <small>ต.ค. {Number(form.fiscalYear) - 1} – ก.ย. {form.fiscalYear}</small>}
              </label>
              <label className="field-block">
                <span className="field-label required">ไตรมาสเริ่มต้น / ยื่นข้อเสนอ</span>
                <select required value={form.quarter} onChange={(e) => updateField('quarter', e.target.value)}>
                  <option value="">เลือกไตรมาส</option>
                  {quarters.map((quarter) => <option key={quarter.value} value={quarter.value}>{quarter.label}</option>)}
                </select>
              </label>
              <label className="field-block col-span-2">
                <span className="field-label required">ชื่อโครงการ / กิจกรรม</span>
                <input
                  required
                  type="text"
                  value={form.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  placeholder="ระบุชื่อโครงการ เช่น โครงการพัฒนาห้องปฏิบัติการ AI & IoT Engineering"
                />
              </label>

              <label className="field-block col-span-2">
                <span className="field-label required">ความสอดคล้องกับแผนยุทธศาสตร์คณะ (ย.1 - ย.4)</span>
                <select
                  value={form.strategicPlanId}
                  onChange={(e) => updateField('strategicPlanId', e.target.value)}
                >
                  {metadata.strategicPlans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span className="field-label required">แหล่งงบประมาณ</span>
                <select
                  value={form.operatingBudgetId}
                  onChange={(e) => updateField('operatingBudgetId', e.target.value)}
                >
                  {metadata.operatingBudgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span className="field-label required">หน่วยงาน / ภาควิชาที่รับผิดชอบ</span>
                <input
                  list="dept-list"
                  value={form.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
                />
                <datalist id="dept-list">
                  {metadata.majors.map((m) => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              </label>

              <label className="field-block">
                <span className="field-label required">ผู้รับผิดชอบโครงการ</span>
                <input
                  required
                  type="text"
                  value={form.owner}
                  onChange={(e) => updateField('owner', e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุล และคำนำหน้า"
                />
              </label>

              <label className="field-block">
                <span className="field-label">ตำแหน่ง / บทบาทในโครงการ</span>
                <input
                  type="text"
                  value={form.ownerRole}
                  onChange={(e) => updateField('ownerRole', e.target.value)}
                  placeholder="เช่น อาจารย์ประจำภาควิชา / หัวหน้าโครงการ"
                />
              </label>

              <label className="field-block">
                <span className="field-label required">วันเริ่มต้นดำเนินงาน</span>
                <input
                  type="text"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  placeholder="เช่น 2569-10-01 หรือ 1 ต.ค. 2569"
                />
              </label>

              <label className="field-block">
                <span className="field-label required">วันสิ้นสุดดำเนินงาน</span>
                <input
                  type="text"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  placeholder="เช่น 2570-09-30 หรือ 30 ก.ย. 2570"
                />
              </label>

              <label className="field-block">
                <span className="field-label">กำหนดเสร็จตามเป้าหมาย</span>
                <input
                  type="text"
                  value={form.targetDate}
                  onChange={(e) => updateField('targetDate', e.target.value)}
                  placeholder="เช่น ไตรมาส 3 หรือ 30 ก.ย. 2569"
                />
              </label>

              <label className="field-block">
                <span className="field-label">สถานที่ดำเนินงาน</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="เช่น อาคาร 9 คณะวิศวกรรมศาสตร์ กำแพงแสน"
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Rationale, Objectives, Methods */}
        {activeStep === 1 && (
          <div className="step-pane animate-fade">
            <h2 className="step-pane-title">2. รายละเอียดโครงการและวิธีดำเนินงาน</h2>

            <label className="field-block">
              <span className="field-label required">หลักการและเหตุผล</span>
              <textarea
                rows={4}
                value={form.rationale}
                onChange={(e) => updateField('rationale', e.target.value)}
                placeholder="ระบุความเป็นมา ความสำคัญ สภาพปัญหา หรือนโยบายที่จำเป็นต้องดำเนินโครงการ..."
              />
            </label>

            {/* Dynamic Objectives */}
            <div className="dynamic-box">
              <div className="dynamic-box-top">
                <span className="field-label required">วัตถุประสงค์ของโครงการ</span>
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={() => addListItem('objectives')}
                >
                  <PlusIcon size={13} />
                  <span>เพิ่มข้อ</span>
                </button>
              </div>

              {form.objectives.map((obj, idx) => (
                <div className="dynamic-row" key={idx}>
                  <span className="row-bullet">{idx + 1}.</span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateList('objectives', idx, e.target.value)}
                    placeholder={`วัตถุประสงค์ข้อที่ ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeListItem('objectives', idx)}
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>

            {/* Dynamic Methods */}
            <div className="dynamic-box">
              <div className="dynamic-box-top">
                <span className="field-label required">วิธีดำเนินการ / แผนขั้นตอนการดำเนินงาน</span>
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={() => addListItem('methods')}
                >
                  <PlusIcon size={13} />
                  <span>เพิ่มขั้นตอน</span>
                </button>
              </div>

              {form.methods.map((method, idx) => (
                <div className="dynamic-row" key={idx}>
                  <span className="row-bullet">{idx + 1}.</span>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => updateList('methods', idx, e.target.value)}
                    placeholder={`ขั้นตอนที่ ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeListItem('methods', idx)}
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>

            <div className="input-grid two-cols">
              <label className="field-block">
                <span className="field-label">กลุ่มเป้าหมาย / ผู้เข้าร่วม</span>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="เช่น นิสิตภาควิชาวิศวกรรมคอมพิวเตอร์ 80 คน"
                />
              </label>

              <label className="field-block">
                <span className="field-label">ผลลัพธ์ / ประโยชน์ที่คาดว่าจะได้รับ</span>
                <input
                  type="text"
                  value={form.expectedOutcomes}
                  onChange={(e) => updateField('expectedOutcomes', e.target.value)}
                  placeholder="เช่น ยกระดับคุณภาพการเรียนการสอนและสร้างผลงานนวัตกรรม"
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Goals & KPIs */}
        {activeStep === 2 && (
          <div className="step-pane animate-fade">
            <h2 className="step-pane-title">3. แผนกลยุทธ์และตัวชี้วัดความสำเร็จ (KPI)</h2>

            <div className="input-grid two-cols">
              <label className="field-block col-span-2">
                <span className="field-label">เป้าประสงค์เชิงกลยุทธ์</span>
                <textarea
                  rows={2}
                  value={form.strategicGoal}
                  onChange={(e) => updateField('strategicGoal', e.target.value)}
                  placeholder="เช่น ยกระดับคุณภาพการเรียนการสอนและสร้างสรรค์นวัตกรรมสู่มาตรฐานสากล"
                />
              </label>

              <label className="field-block col-span-2">
                <span className="field-label">ตัวชี้วัดระดับยุทธศาสตร์ / ค่าเป้าหมายระดับยุทธศาสตร์</span>
                <textarea
                  rows={2}
                  value={form.strategicKpi}
                  onChange={(e) => updateField('strategicKpi', e.target.value)}
                  placeholder="เช่น ร้อยละของนิสิตที่มีทักษะดิจิทัลขั้นสูงตามเกณฑ์มาตรฐาน"
                />
              </label>

              <label className="field-block">
                <span className="field-label required">ตัวชี้วัดโครงการ / กิจกรรม (KPI)</span>
                <textarea
                  rows={3}
                  value={form.kpi}
                  onChange={(e) => updateField('kpi', e.target.value)}
                  placeholder="เช่น จำนวนผู้ผ่านการอบรมไม่น้อยกว่า 60 คน"
                />
              </label>

              <label className="field-block">
                <span className="field-label">ค่าเป้าหมายตัวชี้วัด (Target)</span>
                <textarea
                  rows={3}
                  value={form.kpiTarget}
                  onChange={(e) => updateField('kpiTarget', e.target.value)}
                  placeholder="เช่น 100% หรือ 60 คน"
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: Budget & Timeline */}
        {activeStep === 3 && (
          <div className="step-pane animate-fade">
            <h2 className="step-pane-title">4. แผนงบประมาณและการดำเนินงาน</h2>

            <div className="input-grid two-cols">
              <label className="field-block">
                <span className="field-label required">วงเงินงบประมาณรวม (บาท)</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.budgetAmount}
                  onChange={(e) => updateField('budgetAmount', e.target.value)}
                  placeholder="เช่น 150000 (หากไม่ใช้งบ ให้ใส่ 0)"
                />
              </label>

              <div className="field-block col-span-2 operation-date-range">
                <span className="field-label">แผนการดำเนินการรายเดือน / ไตรมาส</span>
                <div className="operation-date-inputs">
                  <label>
                    <span>วันเริ่มต้น</span>
                    <input
                      type="date"
                      value={form.operationStartDate}
                      max={form.operationEndDate || undefined}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        operationPlan: '',
                        operationStartDate: event.target.value,
                      }))}
                    />
                  </label>
                  <span className="operation-date-separator">ถึง</span>
                  <label>
                    <span>วันสิ้นสุด</span>
                    <input
                      type="date"
                      value={form.operationEndDate}
                      min={form.operationStartDate || undefined}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        operationPlan: '',
                        operationEndDate: event.target.value,
                      }))}
                    />
                  </label>
                </div>
                {form.operationPlan && (
                  <span className="operation-date-legacy">
                    แผนเดิม: {form.operationPlan} — เลือกวันเริ่มต้นและสิ้นสุดเพื่อเปลี่ยนเป็นช่วงวันที่
                  </span>
                )}
              </div>

              <label className="field-block col-span-2">
                <span className="field-label">รายละเอียดความก้าวหน้า / ความเสี่ยง / ปัญหาอุปสรรค</span>
                <textarea
                  rows={3}
                  value={form.progressRisk}
                  onChange={(e) => updateField('progressRisk', e.target.value)}
                  placeholder="ระบุข้อจำกัด ความเสี่ยงในการดำเนินงาน และแนวทางป้องกันแก้ไข..."
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: Confirm */}
        {activeStep === 4 && (
          <div className="step-pane animate-fade">
            <h2 className="step-pane-title">5. ตรวจสอบความถูกต้องของแบบเสนอโครงการ</h2>

            <div className="summary-cards-grid">
              <div className="summary-item">
                <span>ชื่อโครงการ:</span>
                <strong>{form.projectName || '-'}</strong>
              </div>

              <div className="summary-item">
                <span>ผู้รับผิดชอบ:</span>
                <strong>
                  {form.owner || '-'} ({form.department || '-'})
                </strong>
              </div>

              <div className="summary-item">
                <span>ยุทธศาสตร์คณะ:</span>
                <strong>
                  {metadata.strategicPlans.find((s) => String(s.id) === form.strategicPlanId)?.name || '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>งบประมาณ:</span>
                <strong className="text-purple">
                  {formatMoney(Number(form.budgetAmount))} บาท ({metadata.operatingBudgets.find((b) => String(b.id) === form.operatingBudgetId)?.name || '-'})
                </strong>
              </div>

              <div className="summary-item col-span-2">
                <span>ตัวชี้วัดความสำเร็จ (KPI):</span>
                <strong>
                  {form.kpi || '-'} (เป้าหมาย: {form.kpiTarget || '-'})
                </strong>
              </div>
            </div>

            <div className="form-completeness-box">
              <p>{fiscalPeriodLabel(Number(form.fiscalYear), Number(form.quarter))}</p>
              <div className="completeness-info">
                <span>ความครบถ้วนของแบบฟอร์ม: {progressPercent}%</span>
                <span>กรอกแล้ว {completedRequired} จาก {requiredFields.length} หัวข้อสำคัญ</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill bar-color-2" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER BUTTONS */}
        <div className="form-action-bar">
          <div className="bar-left">
            <button
              type="button"
              className="btn-outline"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((curr) => Math.max(curr - 1, 0))}
            >
              ◀ ก่อนหน้า
            </button>
            {activeStep < steps.length - 1 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveStep((curr) => Math.min(curr + 1, steps.length - 1))}
              >
                ถัดไป ▶
              </button>
            )}
          </div>

          <div className="bar-right">
            <button
              type="button"
              className="btn-save-draft"
              disabled={loading}
              onClick={() => handleProjectSubmit('draft')}
            >
              <FileTextIcon size={14} />
              <span>บันทึกฉบับร่าง (Save Draft)</span>
            </button>

            <button
              type="button"
              className="btn-submit-proposal"
              disabled={loading || !form.projectName}
              onClick={() => handleProjectSubmit('submitted')}
            >
              <SendIcon size={14} />
              <span>{form.status === 'resubmit' ? 'ส่งโครงการอีกครั้ง (Resubmit)' : 'ยื่นแบบเสนอโครงการ'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
