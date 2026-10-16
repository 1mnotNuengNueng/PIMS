import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth } from '../middlewares/auth';
import type { AuthUser, AuthedRequest } from '../types';
import {
  requiredString,
  hashPassword,
  verifyPassword,
  signToken,
} from '../utils/helpers';

export const authRouter = Router();

// List department units for 1-click login / quick testing
authRouter.get('/units', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { major: true },
      orderBy: [{ Role: 'asc' }, { Email: 'asc' }],
    });

    const units = users.map((u) => ({
      id: u.id,
      email: u.Email,
      role: u.Role,
      majorId: u.Major_id,
      majorName: u.major.name,
      isApprover: u.Role === Role.admin || u.Role === Role.super_admin,
    }));

    res.json({ units });
  } catch (error) {
    next(error);
  }
});

// 1-Click switch login for convenience
authRouter.post('/switch', async (req, res, next) => {
  try {
    const email = requiredString(req.body.email, 'อีเมล').toLowerCase();
    const user = await prisma.user.findUnique({
      where: { Email: email },
      include: { major: true },
    });

    if (!user) {
      res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.Email,
      role: user.Role,
      majorId: user.Major_id,
      majorName: user.major.name,
    };

    res.json({
      token: signToken(authUser),
      user: { ...authUser, major: user.major.name },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const email = requiredString(req.body.email, 'อีเมล').toLowerCase();
    const password = requiredString(req.body.password, 'รหัสผ่าน');
    const majorName = requiredString(req.body.majorName, 'หน่วยงาน');

    if (password.length < 6) {
      res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    const duplicate = await prisma.user.findUnique({ where: { Email: email } });
    if (duplicate) {
      res.status(409).json({ message: 'อีเมลนี้ถูกสมัครใช้งานแล้ว' });
      return;
    }

    let major = await prisma.major.findFirst({ where: { name: majorName } });
    if (!major) {
      major = await prisma.major.create({ data: { name: majorName } });
    }

    const user = await prisma.user.create({
      data: {
        Email: email,
        hash_password: hashPassword(password),
        Role: Role.staff,
        Major_id: major.id,
      },
      include: { major: true },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.Email,
      role: user.Role,
      majorId: user.Major_id,
      majorName: user.major.name,
    };

    res.status(201).json({
      token: signToken(authUser),
      user: { ...authUser, major: user.major.name },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = requiredString(req.body.email, 'อีเมล').toLowerCase();
    const password = requiredString(req.body.password, 'รหัสผ่าน');
    const user = await prisma.user.findUnique({
      where: { Email: email },
      include: { major: true },
    });

    if (!user || !verifyPassword(password, user.hash_password)) {
      res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.Email,
      role: user.Role,
      majorId: user.Major_id,
      majorName: user.major.name,
    };

    res.json({
      token: signToken(authUser),
      user: { ...authUser, major: user.major.name },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { major: true },
    });

    if (!user) {
      res.status(404).json({ message: 'ไม่พบผู้ใช้' });
      return;
    }

    res.json({
      id: user.id,
      email: user.Email,
      role: user.Role,
      majorId: user.Major_id,
      major: user.major.name,
    });
  } catch (error) {
    next(error);
  }
});
