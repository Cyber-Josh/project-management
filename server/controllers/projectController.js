import prisma from "../configs/prisma.js";


// Create a new project
export const createProject = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority}
    = req.body;

    // Check if the user is an admin of the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true }
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!workspace.members.some((member) => member.userId === userId && member.role === 'admin')) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to create a project in this workspace' });
    }

    const teamLead = await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true }
    });

    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        team_lead: teamLead?.id,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      }
    });

    if(team_members?.length > 0) {
      const membersToadd = []
      workspace.members.forEach((member) => {
        if(team_members.includes(member.user.email)) {
          membersToadd.push(member.user.id);
        }
      });

      await prisma.projectMember.createMany({
        data: membersToadd.map(memberId => ({
          projectId: project.id,
          userId: memberId,
        }))
      });
    }

    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {include: {user: true }},
        tasks: {include: {assignee: true, comments: {include: {user: true}}}},
        owner: true,
      }
    });

    res.json({ project: projectWithMembers, message: 'Project created successfully' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
}; 


// Update project
export const updateProject = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {id, workspaceId, description, name, status, start_date, end_date, progress, priority} = req.body;

    // Check if the user is an admin of the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } }
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!workspace.members.some((member) => member.userId === userId && member.role === 'admin')) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: { members: true }
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      } else if (project.team_lead !== userId) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to update this project' });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      }
    });

    res.json({ project, message: 'Project updated successfully' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};


// Add a member to the project
export const addMember = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {projectId} = req.params;
    const {email} = req.body;

    // Check if user is project lead
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.team_lead !== userId) {
      return res.status(404).json({ message: "only project lead can add members to the project" });
    }

    // Check if the user is already a member
    const existingMember = project.members.find((member) => member.email === email);

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of the project' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      }
    });

    res.json({ member, message: 'Member added to the project successfully' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
}; 