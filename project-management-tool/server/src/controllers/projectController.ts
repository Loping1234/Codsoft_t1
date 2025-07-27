import { Request, Response } from 'express';
import Project from '../models/project';

class ProjectController {
    async createProject(req: Request, res: Response) {
        try {
            const project = new Project(req.body);
            await project.save();
            res.status(201).json(project);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getProjects(req: Request, res: Response) {
        try {
            const projects = await Project.find();
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async updateProject(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            res.status(200).json(project);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteProject(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const project = await Project.findByIdAndDelete(id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new ProjectController();