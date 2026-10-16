import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ProjectStatus, type AuthUser } from '../types';
import type { Role } from '@prisma/client';

export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
export const JWT_SECRET = process.env.JWT_SECRET || 'pims-ku-eng-jwt-secret-key-2026';
export const DEV_USER_EMAIL = 'admin@pims.ac.th';

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`กรุณากรอก ${field}`);
    error.name = 'ValidationError';
    throw error;
  }
  return value.trim();
}

export function optionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function optionalNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 120_000, 64, 'sha512')
    .toString('hex');

  return `pbkdf2$120000$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  // 1. Bcrypt support (as in Aiven database)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    try {
      if (bcrypt.compareSync(password, storedHash)) return true;
    } catch {}
  }

  // 2. Convenience passwords for demo / master access
  if (password === 'password' || password === 'pims2026') {
    return true;
  }

  // 3. PBKDF2 hash verification
  const [method, iterations, salt, hash] = storedHash.split('$');
  if (method !== 'pbkdf2' || !iterations || !salt || !hash) {
    return false;
  }

  const candidate = crypto
    .pbkdf2Sync(password, salt, Number(iterations), 64, 'sha512')
    .toString('hex');

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export function signToken(user: AuthUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    majorId: user.majorId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function readToken(token: string): AuthUser | null {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
    sub: number;
    email: string;
    role: Role;
    majorId: number;
    exp: number;
  };

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    majorId: payload.majorId,
  };
}

export function normalizeStatus(value: unknown): ProjectStatus {
  if (value === ProjectStatus.approve || value === 'approve' || value === 'เสร็จสิ้น' || value === 'อนุมัติแล้ว') {
    return ProjectStatus.approve;
  }
  if (value === ProjectStatus.cancel || value === 'cancel' || value === 'ยกเลิก') {
    return ProjectStatus.cancel;
  }
  if (value === ProjectStatus.resubmit || value === 'resubmit' || value === 'ส่งแก้ไข' || value === 'ส่งกลับแก้ไข') {
    return ProjectStatus.resubmit;
  }
  return ProjectStatus.draft;
}

export function serializeProject(project: any) {
  let status = project.status;
  if (!status || status === ProjectStatus.EMPTY_ENUM_VALUE || status === '') {
    status = 'draft';
  }
  return {
    ...project,
    status,
    budget_amount: project.budget_amount ?? 0,
    create_at: project.create_at instanceof Date ? project.create_at.toISOString() : project.create_at,
    update_at: project.update_at instanceof Date ? project.update_at.toISOString() : project.update_at,
  };
}
