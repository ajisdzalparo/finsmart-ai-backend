import { prisma } from '../utils/database';

export type ReminderInput = {
  message: string;
  reminderDate: string;
  frequency?: string;
  isActive?: boolean;
};

export function listReminders(userId: string | undefined) {
  return prisma.reminder.findMany({ where: { userId } });
}

export function createReminder(userId: string | undefined, input: ReminderInput) {
  return prisma.reminder.create({
    data: {
      ...input,
      reminderDate: new Date(input.reminderDate),
      userId: userId!,
    },
  });
}


