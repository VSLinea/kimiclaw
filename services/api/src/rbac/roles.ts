import { prisma } from '../prisma/client';

export interface AssignRoleInput {
  userId: string;
  roleId: string;
}

export interface RemoveRoleInput {
  userId: string;
  roleId: string;
}

export async function assignRoleToUser(input: AssignRoleInput) {
  const existing = await prisma.userRole.findFirst({
    where: {
      userId: input.userId,
      roleId: input.roleId,
    },
  });

  if (existing) {
    return existing; // Already assigned
  }

  return prisma.userRole.create({
    data: input,
    include: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function removeRoleFromUser(input: RemoveRoleInput) {
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: input.userId,
      roleId: input.roleId,
    },
  });

  if (!userRole) {
    return null;
  }

  return prisma.userRole.delete({
    where: { id: userRole.id },
    include: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function getUserRoles(userId: string) {
  return prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true,
    },
  });
}

export async function getRoleUsers(roleId: string) {
  return prisma.userRole.findMany({
    where: { roleId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function setUserRoles(userId: string, roleIds: string[]) {
  // Remove existing roles not in the new list
  await prisma.userRole.deleteMany({
    where: {
      userId,
      roleId: {
        notIn: roleIds,
      },
    },
  });

  // Add new roles
  const results = [];
  for (const roleId of roleIds) {
    const assignment = await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
      include: {
        role: true,
      },
    });
    results.push(assignment);
  }

  return results;
}
