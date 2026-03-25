import express from 'express';
import { addMember, createProject, updateProject } from '../controllers/projectController.js';

const projectRouter = express.Router();

projectRouter.post('/', createProject);
projectRouter.put('/:id', updateProject);  // also added /:id so you know which project to update
projectRouter.post('/:projectId/addMember', addMember);

export default projectRouter;