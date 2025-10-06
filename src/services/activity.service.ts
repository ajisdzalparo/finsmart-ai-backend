import { prisma } from '../utils/database';

export function listActivity(userId: string | undefined) {
  return prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}


