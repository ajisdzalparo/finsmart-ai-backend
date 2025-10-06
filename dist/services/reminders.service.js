"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReminders = listReminders;
exports.createReminder = createReminder;
const database_1 = require("../utils/database");
function listReminders(userId) {
    return database_1.prisma.reminder.findMany({ where: { userId } });
}
function createReminder(userId, input) {
    return database_1.prisma.reminder.create({
        data: {
            ...input,
            reminderDate: new Date(input.reminderDate),
            userId: userId,
        },
    });
}
