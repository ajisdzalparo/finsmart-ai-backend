"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGoals = listGoals;
exports.createGoal = createGoal;
exports.getGoalById = getGoalById;
exports.updateGoal = updateGoal;
exports.deleteGoal = deleteGoal;
exports.addMoneyToGoal = addMoneyToGoal;
const database_1 = require("../utils/database");
function listGoals(userId) {
    return database_1.prisma.goal.findMany({ where: { userId } });
}
function createGoal(userId, input) {
    return database_1.prisma.goal.create({
        data: {
            ...input,
            targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
            userId: userId,
        },
    });
}
function getGoalById(id, userId) {
    return database_1.prisma.goal.findFirst({
        where: {
            id,
            userId,
        },
    });
}
function updateGoal(id, userId, input) {
    return database_1.prisma.goal.update({
        where: {
            id,
            userId,
        },
        data: {
            ...input,
            targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        },
    });
}
function deleteGoal(id, userId) {
    return database_1.prisma.goal.delete({
        where: {
            id,
            userId,
        },
    });
}
async function addMoneyToGoal(id, userId, amount) {
    // Get goal details first
    const goal = await getGoalById(id, userId);
    if (!goal) {
        throw new Error('Goal not found');
    }
    // Create transaction record for the goal contribution
    const transaction = await database_1.prisma.transaction.create({
        data: {
            amount: amount,
            currency: 'IDR',
            description: `Goal Contribution: ${goal.name}`,
            transactionDate: new Date(),
            userId: userId,
            categoryId: null, // Goals don't need category
            isRecurring: false,
            autoCategorized: false,
        },
    });
    // Update goal with new amount
    const updatedGoal = await database_1.prisma.goal.update({
        where: {
            id,
            userId,
        },
        data: {
            currentAmount: {
                increment: amount,
            },
        },
    });
    return {
        goal: updatedGoal,
        transaction: transaction,
    };
}
