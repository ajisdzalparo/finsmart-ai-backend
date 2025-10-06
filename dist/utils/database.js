"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function connectDatabase() {
    await exports.prisma.$connect();
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
}
