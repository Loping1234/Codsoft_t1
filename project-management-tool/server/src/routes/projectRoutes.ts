import { Router } from 'express';
import ProjectController from '../controllers/projectController';

const router = Router();
const projectController = new ProjectController();

router.post('/projects', projectController.createProject);
router.get('/projects', projectController.getAllProjects);
router.get('/projects/:id', projectController.getProjectById);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

export default function setProjectRoutes(app) {
    app.use('/api', router);
}