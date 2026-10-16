import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import type { AuthedRequest } from '../types';
import { hashPassword, readToken, requiredString } from '../utils/helpers';

export const usersRouter = Router();

usersRouter.use(async (req: AuthedRequest, res, next) => {
  const authHeader = req.header('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const tokenUser = token ? readToken(token) : null;
  if (!tokenUser) {
    res.status(401).json({ message: 'กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: tokenUser.id }, include: { major: true } });
    if (!user || (user.Role !== Role.admin && user.Role !== Role.super_admin)) {
      res.status(403).json({ message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการผู้ใช้ได้' });
      return;
    }
    req.user = {
      id: user.id,
      email: user.Email,
      role: user.Role,
      majorId: user.Major_id,
      majorName: user.major.name,
    };
    next();
  } catch (error) {
    next(error);
  }
});

usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { major: true },
      orderBy: [{ Major_id: 'asc' }, { Email: 'asc' }],
    });

    res.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.Email,
        role: user.Role,
        majorId: user.Major_id,
        major: user.major.name,
      })),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const email = requiredString(req.body.email, 'อีเมล').toLowerCase();
    const password = requiredString(req.body.password, 'รหัสผ่าน');
    const majorId = Number(req.body.majorId);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    if (!Number.isInteger(majorId) || majorId <= 0) {
      res.status(400).json({ message: 'กรุณาเลือกหน่วยงาน' });
      return;
    }

    const [duplicate, major] = await Promise.all([
      prisma.user.findUnique({ where: { Email: email } }),
      prisma.major.findUnique({ where: { id: majorId } }),
    ]);
    if (duplicate) {
      res.status(409).json({ message: 'อีเมลนี้มีผู้ใช้งานแล้ว' });
      return;
    }
    if (!major) {
      res.status(400).json({ message: 'ไม่พบหน่วยงานที่เลือก' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        Email: email,
        hash_password: hashPassword(password),
        Role: Role.staff,
        Major_id: majorId,
      },
      include: { major: true },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.Email,
        role: user.Role,
        majorId: user.Major_id,
        major: user.major.name,
      },
      message: 'สร้างบัญชีผู้ใช้เรียบร้อยแล้ว',
    });
  } catch (error) {
    next(error);
  }
});
