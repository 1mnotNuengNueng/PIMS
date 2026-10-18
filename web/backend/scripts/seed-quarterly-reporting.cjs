require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DEMO_PREFIX = '[DEMO-QUARTERLY-v1]';
const date = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

async function main() {
  await prisma.$transaction(async (tx) => {
    const author = await tx.user.findFirst({ where: { Role: 'staff' }, orderBy: { id: 'asc' } }) || await tx.user.findFirst({ orderBy: { id: 'asc' } });
    const reviewer = await tx.user.findFirst({ where: { Role: { in: ['admin', 'super_admin'] } }, orderBy: { id: 'asc' } });
    const strategy = await tx.strategicPlan.findFirst({ orderBy: { id: 'asc' } });
    const budget = await tx.operatingBudget.findFirst({ orderBy: { id: 'asc' } });
    if (!author || !reviewer || !strategy || !budget) throw new Error('Reference users, strategy and budget must exist before seeding.');

    for (const year of [2569, 2570]) {
      const ce = year - 543;
      const fiscalYear = await tx.fiscalYear.upsert({
        where: { year }, update: {},
        create: { year, start_date: date(ce - 1, 10, 1), end_date: date(ce, 9, 30) },
      });
      for (let quarter = 1; quarter <= 4; quarter++) {
        const start = new Date(Date.UTC(ce - 1, 9 + (quarter - 1) * 3, 1));
        const end = new Date(Date.UTC(ce - 1, 12 + (quarter - 1) * 3, 0));
        // Example deadlines only: 30 days after the quarter ends.
        const due = new Date(end.getTime() + 30 * 86400000);
        await tx.fiscalPeriod.upsert({
          where: { fiscal_year_id_quarter: { fiscal_year_id: fiscalYear.id, quarter } }, update: {},
          create: { fiscal_year_id: fiscalYear.id, quarter, start_date: start, end_date: end, report_due_date: due },
        });
      }
      const name = `${DEMO_PREFIX} ${year === 2569 ? 'โครงการพัฒนาทักษะดิจิทัล ปี 2569' : 'โครงการห้องปฏิบัติการนวัตกรรม ปี 2570'}`;
      let project = await tx.projectForm.findFirst({ where: { name } });
      if (!project) project = await tx.projectForm.create({ data: {
        name, fiscal_year: year, quarter: 1, create_by: author.id,
        strategic_plan_id: strategy.id, operating_budget_id: budget.id,
        responsible_person: 'ผู้รับผิดชอบโครงการจำลอง', target_group: 'นิสิต 80 คน (ข้อมูลจำลอง)',
        principles_rationale: 'ข้อมูลจำลองสำหรับทดสอบรายงานผลรายไตรมาส ไม่ใช่ผลดำเนินงานจริง',
        objective: 'พัฒนาทักษะนิสิตและติดตามผลการดำเนินงานทุกไตรมาส',
        implementation_procedure: 'วางแผน\nจัดกิจกรรม\nประเมินผล\nสรุปรายงาน',
        duration_of_operations: `1 ต.ค. ${year - 1} - 30 ก.ย. ${year}`,
        location: 'คณะวิศวกรรมศาสตร์ (ข้อมูลจำลอง)', evaluation: 'จำนวนผู้ผ่านกิจกรรมและความพึงพอใจ',
        expected_outcomes: 'นิสิตมีทักษะเพิ่มขึ้น (ข้อมูลจำลอง)', project_kpi: 'ผู้ผ่านกิจกรรมอย่างน้อย 80 คน',
        kpi_target: '80 คน', budget_amount: 120000, status: 'approve',
      } });
      const fiscalPeriods = await tx.fiscalPeriod.findMany({ where: { fiscal_year_id: fiscalYear.id }, orderBy: { quarter: 'asc' } });
      const statuses = year === 2569 ? ['approved', 'approved', 'submitted', 'resubmit'] : ['draft'];
      const results = ['จัดทำแผนและสำรวจความต้องการแล้ว', 'จัดอบรมทักษะดิจิทัลแล้ว 2 รุ่น', 'ติดตามผลงานและประเมินทักษะ', 'สรุปผลกิจกรรมและเตรียมปรับปรุงรายงาน'];
      for (let index = 0; index < statuses.length; index++) {
        const period = fiscalPeriods[index];
        const status = statuses[index];
        const reviewed = ['approved', 'resubmit'].includes(status);
        await tx.projectQuarterlyReport.upsert({
          where: { project_id_fiscal_period_id: { project_id: project.id, fiscal_period_id: period.id } }, update: {},
          create: {
            project_id: project.id, fiscal_period_id: period.id, is_demo: true, status,
            results: `[ข้อมูลจำลอง] ${year === 2570 ? 'ร่างแผนกิจกรรม ยังไม่ส่งรายงานผล' : results[index]}`,
            kpi_results: year === 2570 ? 'ยังไม่มีผลประเมิน' : `ผู้เข้าร่วมสะสม ${[20, 45, 65, 80][index]} คน จากเป้าหมาย 80 คน`,
            budget_spent: year === 2570 ? 0 : [10000, 35000, 40000, 25000][index],
            progress_percent: year === 2570 ? 0 : [20, 50, 80, 100][index],
            problems: index === 3 ? '[ข้อมูลจำลอง] ต้องแนบหลักฐานค่าใช้จ่ายเพิ่มเติม' : '[ข้อมูลจำลอง] ไม่พบปัญหาสำคัญ',
            next_steps: '[ข้อมูลจำลอง] ติดตามผลและจัดเตรียมหลักฐานประกอบรายงาน',
            reported_by: author.id,
            submitted_at: status === 'draft' ? null : new Date(period.end_date.getTime() + 5 * 86400000),
            reviewed_by: reviewed ? reviewer.id : null,
            reviewed_at: reviewed ? new Date(period.end_date.getTime() + 7 * 86400000) : null,
            review_comment: status === 'resubmit' ? '[ข้อมูลจำลอง] กรุณาแนบหลักฐานค่าใช้จ่ายให้ครบถ้วน' : reviewed ? '[ข้อมูลจำลอง] ตรวจรายงานแล้ว' : null,
          },
        });
      }
    }
  }, { maxWait: 10000, timeout: 60000 });
  console.log('Demo seed ready: 2 fiscal years, 8 periods, 2 marked demo projects, 5 demo reports. Existing records are preserved on rerun.');
}
main().catch((error) => {
  console.error('Quarterly seed failed:', error.code || error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
