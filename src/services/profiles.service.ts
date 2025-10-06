import { prisma } from "../utils/database";

export async function listProfiles(userId: string | undefined) {
  return prisma.profile.findMany({ where: { userId } });
}

export type ProfileInput = { name: string; age?: number };

export async function createProfile(userId: string | undefined, input: ProfileInput) {
  return prisma.profile.create({ data: { ...input, userId: userId! } });
}


