import type { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import type { AuthUser, AuthedRequest } from '../types';
import { readToken, hashPassword } from '../utils/helpers';

export async function getDevUser(): Promise<AuthUser> {
  let user = await prisma.user.findFirst({
    where: { Role: Role.admin },
    include: { major: true },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      include: { major: true },
    });
  }

  if (!user) {
    let major = await prisma.major.findFirst({ orderBy: { id: 'asc' } });
    if (!major) {
      major = await prisma.major.create({ data: { name: 'สำนักงานเลขานุการ' } });
    }

    user = await prisma.user.create({
      data: {
        Email: 'admin@pims.ac.th',
        hash_password: hashPassword('password'),
        Role: Role.admin,
        Major_id: major.id,
      },
      include: { major: true },
    });
  }

  return {
    id: user.id,
    email: user.Email,
    role: user.Role,
    majorId: user.Major_id,
    majorName: user.major.name,
  };
}

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? readToken(token) : null;

  try {
    if (user) {
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { major: true },
      });
      if (fullUser) {
        req.user = {
          id: fullUser.id,
          email: fullUser.Email,
          role: fullUser.Role,
          majorId: fullUser.Major_id,
          majorName: fullUser.major.name,
        };
        next();
        return;
      }
    }

    req.user = await getDevUser();
    next();
  } catch (error) {
    next(error);
  }
}
