import type {
  AuthResponse,
  LoginRequest,
  OAuthProvider,
  RegisterCandidateRequest,
  RegisterRecruiterRequest,
  UserRole,
} from "@ai-interviewer/api-types";
import { prisma, type PrismaTransactionClient } from "../../infrastructure/db/prisma.client";
import { ensureUniqueCompanySlug, slugifyCompanyName } from "../../domain/company-slug";
import { signAccessToken, toAuthUser } from "./jwt.service";
import {
  exchangeOAuthCode,
  oauthProviderKeyToEnum,
  type OAuthProfile,
} from "./oauth.service";
import type { OAuthProviderKey } from "../../config/env";

const userInclude = {
  company: {
    select: { id: true, name: true, slug: true },
  },
} as const;

export class AuthError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "bcrypt", cost: 12 });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

async function buildAuthResponse(userId: string): Promise<AuthResponse> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: userInclude,
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
    companyId: user.companyId ?? undefined,
  });

  return {
    accessToken,
    user: toAuthUser({
      ...user,
      role: user.role as UserRole,
    }),
  };
}

export async function registerCandidate(input: RegisterCandidateRequest): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new AuthError("An account with this email already exists.", 409);
  }

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: "CANDIDATE",
    },
  });

  return buildAuthResponse(user.id);
}

export async function registerRecruiter(input: RegisterRecruiterRequest): Promise<AuthResponse> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("An account with this email already exists.", 409);
  }

  const baseSlug = slugifyCompanyName(input.companyName);
  const slug = await ensureUniqueCompanySlug(baseSlug, async (candidate) => {
    const company = await prisma.company.findUnique({ where: { slug: candidate } });
    return Boolean(company);
  });

  const user = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const company = await tx.company.create({
      data: {
        name: input.companyName.trim(),
        slug,
      },
    });

    const createdUser = await tx.user.create({
      data: {
        email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
        role: "RECRUITER",
        companyId: company.id,
      },
    });

    await tx.recruiterProfile.create({
      data: {
        userId: createdUser.id,
        companyId: company.id,
        title: input.title ?? null,
      },
    });

    return createdUser;
  });

  return buildAuthResponse(user.id);
}

export async function login(input: LoginRequest): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user?.passwordHash) {
    throw new AuthError("Invalid email or password.", 401);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password.", 401);
  }

  return buildAuthResponse(user.id);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!user) {
    throw new AuthError("User not found.", 404);
  }

  return toAuthUser({
    ...user,
    role: user.role as UserRole,
  });
}

async function findOrCreateUserFromOAuth(
  provider: OAuthProvider,
  profile: OAuthProfile,
  role: UserRole,
): Promise<{ userId: string; isNewUser: boolean }> {
  const linkedAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (linkedAccount) {
    const updates: { name?: string; avatarUrl?: string } = {};
    if (profile.name && !linkedAccount.user.name) updates.name = profile.name;
    if (profile.avatarUrl && !linkedAccount.user.avatarUrl) updates.avatarUrl = profile.avatarUrl;

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: linkedAccount.userId },
        data: updates,
      });
    }

    return { userId: linkedAccount.userId, isNewUser: false };
  }

  const email = profile.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider,
        providerAccountId: profile.providerAccountId,
      },
    });

    return { userId: existingUser.id, isNewUser: false };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      role,
      oauthAccounts: {
        create: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    },
  });

  return { userId: user.id, isNewUser: true };
}

export async function completeOAuthLogin(
  provider: OAuthProviderKey,
  code: string,
  role: UserRole,
): Promise<AuthResponse> {
  const profile = await exchangeOAuthCode(provider, code);
  const providerEnum = oauthProviderKeyToEnum(provider);
  const { userId } = await findOrCreateUserFromOAuth(providerEnum, profile, role);
  return buildAuthResponse(userId);
}

export async function listCompanies() {
  return prisma.company.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}
