"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.verifyPassword = verifyPassword;
exports.createJwtToken = createJwtToken;
exports.verifyJwtToken = verifyJwtToken;
exports.updateUserProfile = updateUserProfile;
const database_1 = require("../utils/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function getUserByEmail(email) {
    return database_1.prisma.user.findUnique({ where: { email } });
}
async function getUserById(userId) {
    return database_1.prisma.user.findUnique({ where: { id: userId } });
}
async function createUser(email, password, name) {
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    return database_1.prisma.user.create({ data: { email, passwordHash, name } });
}
async function verifyPassword(password, passwordHash) {
    return bcrypt_1.default.compare(password, passwordHash);
}
function createJwtToken(userId) {
    const secret = process.env.JWT_SECRET || "";
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: "7d" });
}
function verifyJwtToken(token) {
    const secret = process.env.JWT_SECRET || "";
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        return payload;
    }
    catch (err) {
        return null;
    }
}
async function updateUserProfile(userId, profileData) {
    return database_1.prisma.user.update({
        where: { id: userId },
        data: profileData,
    });
}
