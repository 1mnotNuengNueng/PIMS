// Exercise the actual routes with an isolated database double; no live records are written.
require('ts-node').register({ transpileOnly: true, compilerOptions: { rootDir: '..' } });
const assert = require('node:assert/strict');
const { prisma } = require('../src/prisma');
const admin = { id: 1, role: 'admin', majorId: 1 };
const owner = { id: 2, role: 'staff', majorId: 2 };
const outsider = { id: 3, role: 'staff', majorId: 3 };
let record;
const departments = [{ id: 1, name: 'Admin unit' }, { id: 2, name: 'Owner unit' }];
const hydrate = () => ({ ...record, department: departments.find(d => d.id === record.department_id), user: { Major_id: 1, major: departments[0] }, quarterly_reports: [] });
const matches = (where, row) => Object.entries(where).every(([key, value]) => {
  if (key === 'OR') return value.some(condition => matches(condition, row));
  if (key === 'AND') return value.every(condition => matches(condition, row));
  if (value && typeof value === 'object') return value.contains !== undefined ? String(row[key] || '').includes(value.contains) : matches(value, row[key] || {});
  return row[key] === value;
});
prisma.major.findFirst = async ({ where }) => departments.find(d => d.name === where.name);
prisma.user.findUnique = async () => ({ Major_id: 1 });
prisma.fiscalYear.upsert = async () => ({ id: 1 });
prisma.fiscalPeriod.upsert = async () => ({});
prisma.$queryRaw = async () => [];
prisma.$transaction = async callback => callback(prisma);
prisma.projectForm.create = async ({ data }) => {
  record = { ...data, id: 100, update_at: new Date(), create_at: new Date() };
  return hydrate();
};
prisma.projectForm.findMany = async ({ where }) => record && matches(where, hydrate()) ? [hydrate()] : [];
prisma.projectForm.findUnique = prisma.projectForm.findUniqueOrThrow = async () => hydrate();
prisma.projectForm.update = async ({ data }) => { record = { ...record, ...data, update_at: new Date() }; return hydrate(); };
prisma.projectForm.updateMany = async ({ where, data }) => {
  if (!matches(where, record)) return { count: 0 };
  record = { ...record, ...data }; return { count: 1 };
};
const { projectRouter } = require('../src/routes/project.routes');
async function call(method, path, user, body = {}, query = {}) {
  const layer = projectRouter.stack.find(layer => layer.route?.path === path && layer.route.methods[method]);
  assert.ok(layer, `${method} ${path}`);
  const handler = layer.route.stack.at(-1).handle;
  let result;
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { result = data; return this; } };
  await handler({ user, body, query, params: { id: 100 } }, res, error => { throw error; });
  return { ...result, statusCode: res.statusCode };
}
async function main() {
  const body = { department_name: 'Owner unit', fiscal_year: 2570, quarter: 1, name: 'Delegated project', strategic_plan_id: 1, operating_budget_id: 1, responsible_person: 'Owner', principles_rationale: 'Reason', objective: 'Objective', target_group: 'Students', implementation_procedure: 'Steps', duration_of_operations: '2569-11-01 - 2569-12-01', status: 'draft' };
  const created = await call('post', '/', admin, body);
  assert.equal(created.project.department_id, owner.majorId);
  assert.equal(created.project.create_by, admin.id);
  assert.equal((await call('get', '/', owner, {}, { filter: 'mine' })).projects.length, 1);
  assert.equal((await call('get', '/', outsider)).projects.length, 0);
  await call('patch', '/:id', admin, { ...body, status: 'submitted' });
  await call('post', '/:id/review', admin, { action: 'resubmit', comment: 'Update the title' });
  const returned = (await call('get', '/', owner)).projects[0];
  assert.equal(returned.status, 'resubmit');
  assert.equal(returned.review_comment, 'Update the title');
  assert.equal(returned.department_id, owner.majorId);
  const denied = await call('patch', '/:id', outsider, { name: 'Unauthorized edit' });
  assert.equal(denied.statusCode, 403);
  await call('patch', '/:id', owner, { name: 'Corrected title' });
  assert.equal(record.status, 'resubmit');
  await call('patch', '/:id', owner, { status: 'submitted' });
  assert.equal(record.status, 'submitted');
  assert.equal(record.department_id, owner.majorId);
  assert.equal(record.create_by, admin.id);
  await call('post', '/:id/review', admin, { action: 'approve', comment: '' });
  await call('patch', '/:id', owner, { name: 'Updated approved project', budget_amount: 200000 });
  assert.equal(record.status, 'approve');
  await assert.rejects(call('post', '/:id/review', owner, { action: 'cancel', comment: 'Bypass' }), error => error.statusCode === 400);
  await assert.rejects(call('post', '/:id/cancellation-request', outsider, { action: 'request', reason: 'Wrong unit' }), error => error.statusCode === 403);
  await call('post', '/:id/cancellation-request', owner, { action: 'request', reason: 'Unable to conduct project' });
  assert.equal(record.status, 'approve');
  assert.equal(record.cancellation_request_status, 'pending');
  await assert.rejects(call('post', '/:id/cancellation-request', owner, { action: 'approve' }), error => error.statusCode === 403);
  await assert.rejects(call('post', '/:id/cancellation-request', owner, { action: 'request', reason: 'Duplicate' }), error => error.statusCode === 409);
  await call('post', '/:id/cancellation-request', admin, { action: 'reject', reason: 'Please continue' });
  assert.equal(record.status, 'approve');
  assert.equal(record.cancellation_request_status, 'rejected');
  await call('post', '/:id/cancellation-request', owner, { action: 'request', reason: 'No venue available' });
  await call('post', '/:id/cancellation-request', admin, { action: 'approve', reason: 'Confirmed' });
  assert.equal(record.status, 'cancel');
  assert.equal(record.cancellation_reason, 'No venue available');
  assert.equal(record.cancellation_request_status, 'approved');
  // Restore the isolated fixture for the approved-edit assertions below.
  record.status = 'approve';
  assert.equal(record.name, 'Updated approved project');
  assert.equal(record.budget_amount, 200000);
  await assert.rejects(call('patch', '/:id', owner, { status: 'draft' }), error => error.statusCode === 400);
  assert.equal(record.status, 'approve');
  console.log('PASS: admin-created project belongs to selected department; return, owner edit and resubmission; outsider denied.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
