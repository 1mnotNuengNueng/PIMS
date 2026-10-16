import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { hashPassword } from '../utils/helpers';
import { ProjectStatus } from '../types';

export const defaultMajors = [
  'สำนักงานเลขานุการคณะวิศวกรรมศาสตร์',
  'ฝ่ายวิชาการ',
  'ฝ่ายดิจิทัล',
  'ฝ่ายหลักสูตรนานาชาติและความสัมพันธ์ระหว่างประเทศ',
  'รองคณบดีฝ่ายวิจัยและนวัตกรรมสากล',
  'รองคณบดีฝ่ายพัฒนาองค์กร',
  'รองคณบดีฝ่ายบริหารทุนมนุษย์',
  'รองคณบดีฝ่ายบริหารและความสำเร็จในการศึกษา',
  'ผู้ช่วยคณบดีฝ่ายกายภาพและสิ่งแวดล้อม',
  'ผู้ช่วยคณบดีฝ่ายนวัตกรรมและพันธกิจเพื่อสังคม',
  'ภาควิชาวิศวกรรมคอมพิวเตอร์',
  'ภาควิชาวิศวกรรมโยธา',
  'ภาควิชาวิศวกรรมเครื่องกล',
  'ภาควิชาวิศวกรรมอุตสาหการ',
  'ภาควิชาวิศวกรรมเกษตร',
  'ภาควิชาวิศวกรรมชลประทาน',
  'ภาควิชาวิศวกรรมอาหาร',
  'ศูนย์เครื่องจักรกลการเกษตรแห่งชาติ',
  'ศูนย์วิศวกรรมพลังงาน',
  'ศูนย์ทดสอบประตูหน้าต่างและผนังกระจก',
  'หลักสูตรวิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม',
];

export const defaultStrategies = [
  {
    name: 'ย.1 พัฒนาผู้เชี่ยวชาญสหวิศวกรรมด้วยความร่วมมือและการเรียนรู้ตลอดชีวิตผ่านเครือข่ายสากล',
    strategic_details: 'กลุ่มโครงการด้านหลักสูตร ผู้เรียน การเรียนรู้ตลอดชีวิต และความเป็นนานาชาติ',
  },
  {
    name: 'ย.2 สรรสร้างนวัตกรรมและองค์ความรู้ใหม่เพื่อตอบสนองความท้าทายผ่านระบบนิเวศวิจัยเชิงบูรณาการ',
    strategic_details: 'กลุ่มโครงการด้านวิจัย นวัตกรรม และการใช้ประโยชน์องค์ความรู้',
  },
  {
    name: 'ย.3 ยกระดับผลกระทบทางสังคมด้วยวิศวกรรมเพื่อความยั่งยืน',
    strategic_details: 'กลุ่มโครงการบริการวิชาการ พันธกิจเพื่อสังคม และความยั่งยืน',
  },
  {
    name: 'ย.4 พัฒนาระบบบริหารจัดการองค์กรสู่ความเป็นเลิศ',
    strategic_details: 'กลุ่มโครงการพัฒนากระบวนการ บุคลากร ดิจิทัล และการบริหารจัดการ',
  },
];

export const defaultBudgets = [
  {
    name: 'งบประมาณแผ่นดิน',
    budget_detail: 'งบประมาณรายจ่ายประจำปี',
  },
  {
    name: 'งบประมาณเงินรายได้',
    budget_detail: 'งบประมาณเงินรายได้ของคณะวิศวกรรมศาสตร์',
  },
  {
    name: 'ไม่ใช้งบประมาณ',
    budget_detail: 'กิจกรรมที่ดำเนินงานโดยไม่ใช้งบประมาณ',
  },
];

export const defaultUnitAccounts = [
  { email: 'admin@ku.ac.th', role: Role.admin, majorName: 'สำนักงานเลขานุการคณะวิศวกรรมศาสตร์', title: 'ผู้ดูแลระบบและผู้อนุมัติโครงการ (Admin/Reviewer)' },
  { email: 'cpe@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมคอมพิวเตอร์', title: 'ภาควิชาวิศวกรรมคอมพิวเตอร์' },
  { email: 'ce@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมโยธา', title: 'ภาควิชาวิศวกรรมโยธา' },
  { email: 'me@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมเครื่องกล', title: 'ภาควิชาวิศวกรรมเครื่องกล' },
  { email: 'ie@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมอุตสาหการ', title: 'ภาควิชาวิศวกรรมอุตสาหการ' },
  { email: 'ae@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมเกษตร', title: 'ภาควิชาวิศวกรรมเกษตร' },
  { email: 'ire@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมชลประทาน', title: 'ภาควิชาวิศวกรรมชลประทาน' },
  { email: 'fe@ku.ac.th', role: Role.staff, majorName: 'ภาควิชาวิศวกรรมอาหาร', title: 'ภาควิชาวิศวกรรมอาหาร' },
  { email: 'academic@ku.ac.th', role: Role.staff, majorName: 'ฝ่ายวิชาการ', title: 'ฝ่ายวิชาการ' },
  { email: 'digital@ku.ac.th', role: Role.staff, majorName: 'ฝ่ายดิจิทัล', title: 'ฝ่ายดิจิทัล' },
  { email: 'research@ku.ac.th', role: Role.staff, majorName: 'รองคณบดีฝ่ายวิจัยและนวัตกรรมสากล', title: 'ฝ่ายวิจัยและนวัตกรรมสากล' },
];

export async function seedReferenceData() {
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    // Database already populated
    return;
  }

  const majorMap = new Map<string, number>();
  for (const name of defaultMajors) {
    let existing = await prisma.major.findFirst({ where: { name } });
    if (!existing) {
      existing = await prisma.major.create({ data: { name } });
    }
    majorMap.set(name, existing.id);
  }

  for (const strategy of defaultStrategies) {
    let existing = await prisma.strategicPlan.findFirst({
      where: { name: strategy.name },
    });
    if (!existing) {
      await prisma.strategicPlan.create({ data: strategy });
    }
  }

  for (const budget of defaultBudgets) {
    let existing = await prisma.operatingBudget.findFirst({
      where: { name: budget.name },
    });
    if (!existing) {
      await prisma.operatingBudget.create({ data: budget });
    }
  }

  const defaultPasswordHash = hashPassword('pims2026');
  for (const acc of defaultUnitAccounts) {
    let majorId = majorMap.get(acc.majorName);
    if (!majorId) {
      const m = await prisma.major.create({ data: { name: acc.majorName } });
      majorId = m.id;
      majorMap.set(acc.majorName, majorId);
    }

    let user = await prisma.user.findUnique({ where: { Email: acc.email } });
    if (!user) {
      await prisma.user.create({
        data: {
          Email: acc.email,
          hash_password: defaultPasswordHash,
          Role: acc.role,
          Major_id: majorId,
        },
      });
    }
  }
}
