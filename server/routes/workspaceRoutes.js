import express from "express";
import { addMember, getUserWorkspaces, syncCurrentWorkspace } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/add-member", addMember);
workspaceRouter.post("/sync-current", syncCurrentWorkspace);

export default workspaceRouter;
