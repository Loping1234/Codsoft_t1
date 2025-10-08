import React, { useEffect, useState } from 'react';
import ProjectList from '../components/ProjectList';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate fetching data or any initialization logic
        const fetchData = async () => {
            try {
                // Fetch project data or perform any necessary setup
                // await fetchProjects();
                setLoading(false);
            } catch (err) {
                setError('Failed to load projects');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateProject = () => {
        // Logic to create a new project
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <button onClick={handleCreateProject}>Create New Project</button>
            {loading && <p>Loading projects...</p>}
            {error && <p>{error}</p>}
            <ProjectList />
        </div>
    );
};

export default Dashboard;