"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProfiles = listProfiles;
exports.createProfile = createProfile;
const database_1 = require("../utils/database");
async function listProfiles(userId) {
    return database_1.prisma.profile.findMany({ where: { userId } });
}
async function createProfile(userId, input) {
    return database_1.prisma.profile.create({ data: { ...input, userId: userId } });
}
