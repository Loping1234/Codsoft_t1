import React, { useEffect, useState } from 'react';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch('/api/projects');
                const data = await response.json();
                setProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div>
            <h2>Project List</h2>
            <ul>
                {projects.map(project => (
                    <li key={project.id}>
                        <h3>{project.name}</h3>
                        <p>{project.description}</p>
                        <p>Deadline: {project.deadline}</p>
                        <p>Progress: {project.progress}%</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProjectList;