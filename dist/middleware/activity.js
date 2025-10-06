"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const database_1 = require("../utils/database");
function logActivity(action, entityType) {
    return async (req, _res, next) => {
        try {
            await database_1.prisma.activityLog.create({
                data: {
                    action,
                    entityType,
                    entityId: req.entityId,
                    description: req.description,
                    userId: req.userId,
                },
            });
        }
        catch {
            // ignore logging errors
        }
        next();
    };
}
