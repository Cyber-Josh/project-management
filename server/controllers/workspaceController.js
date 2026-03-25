import prisma from "../configs/prisma.js";


// Get all workspaces for a user
export const getUserWorkspaces = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: {userId: userId} } // Assuming a many-to-many relationship between users and workspaces
      },
      include: {
        members: {include: {user: true}},
        projects: {
          include: {
            tasks: {include: {assignee: true, comments: {include: {user: true}}}},
            members: {include: {user: true}}
          }
        },
        owner: true
      }
    });
    res.json(workspaces);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
}

// Add member to workspace
export const addMember = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {email, role, workspaceID, message} = req.body;
    const normalizedRole = String(role || "").replace(/^org:/i, "").toUpperCase();

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if(!workspaceID || !role) {
      return res.status(400).json({ message: 'Workspace ID and role are required' });
    }

    if(!['ADMIN', 'MEMBER'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be ADMIN or MEMBER' });
    }

    // Fetch workspace
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceID }, include: { members: true } });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if creator has admin role
    if(!workspace.members.find((member) => member.userId === userId && member.role === 'ADMIN')) {
      return res.status(401).json({ message: 'You do not have admin privileges' });
    }

    // Check if user is already a member
    const existingMember = workspace.members.find((member) => member.userId === user.id);
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspaceID,
        role: normalizedRole,
        message
      }
    });

    res.json({ member, message: 'Member added successfully'});

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
}

// Sync currently selected Clerk organization into local DB for immediate dashboard visibility
export const syncCurrentWorkspace = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id, name, slug, image_url } = req.body;

    if (!id || !name || !slug) {
      return res.status(400).json({ message: "Workspace id, name, and slug are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return res.status(404).json({ message: "User not found in local DB" });
    }

    const workspace = await prisma.workspace.upsert({
      where: { id },
      update: {
        name,
        slug,
        image_url: image_url || "",
      },
      create: {
        id,
        name,
        slug,
        ownerId: userId,
        image_url: image_url || "",
      },
    });

    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: id,
        },
      },
      update: {},
      create: {
        userId,
        workspaceId: id,
        role: "ADMIN",
      },
    });

    return res.json({ workspace, message: "Workspace synced successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.code || error.message });
  }
};
