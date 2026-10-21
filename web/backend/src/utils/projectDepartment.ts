import type { Prisma } from '@prisma/client';

export function departmentProjectFilter(majorId: number): Prisma.ProjectFormWhereInput {
  return { OR: [
    { department_id: majorId },
    { department_id: null, user: { Major_id: majorId } },
  ] };
}
