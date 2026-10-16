import type { Request } from 'express';
import { project_form_status, Role } from '@prisma/client';

export type ProjectStatus = project_form_status;
export const ProjectStatus = project_form_status;

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
  majorId: number;
  majorName?: string;
};

export type AuthedRequest = Request & { user?: AuthUser };
