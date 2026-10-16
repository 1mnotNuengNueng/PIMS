import { Router } from 'express';
import { authRouter } from './auth.routes';
import { metadataRouter } from './metadata.routes';
import { dashboardRouter } from './dashboard.routes';
import { projectRouter } from './project.routes';
import { usersRouter } from './users.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/metadata', metadataRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/users', usersRouter);
