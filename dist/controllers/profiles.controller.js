"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfiles = getProfiles;
exports.postProfile = postProfile;
const zod_1 = require("zod");
const profiles_service_1 = require("../services/profiles.service");
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    age: zod_1.z.number().int().min(0).optional(),
});
async function getProfiles(req, res) {
    const profiles = await (0, profiles_service_1.listProfiles)(req.userId);
    res.json(profiles);
}
async function postProfile(req, res) {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const profile = await (0, profiles_service_1.createProfile)(req.userId, parsed.data);
    res.status(201).json(profile);
}
