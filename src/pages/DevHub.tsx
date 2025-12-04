import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, X, Code, Trash2, ExternalLink } from "lucide-react";
import { initDB, getProjects, addProjectToDB, deleteProjectFromDB, Project, getSetting } from "../lib/db";
import { useNavigate } from "react-router-dom";

// Configuration for the template
const TEMPLATE_URL = "https://github.com/foxvoid-studio/fantasy-craft-default-template.git"

export default function DevHub() {
    const navigate = useNavigate();

    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]); // Store local projects

    // Form States
    const [projectName, setProjectName] = useState("");
    const [basePath, setBasePath] = useState("");

    // 1. Load projects on Mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            await initDB(); // Ensure DB is ready
            const list = await getProjects();
            setProjects(list);
        } catch (error) {
            console.error("Failed to load projects:", error);
        }
    };

    // Handler Folder Selection
    const selectFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false
            });

            if (selected) {
                setBasePath(selected as string);
            }
        }
        catch (err) {
            console.error("Failed to pick folder:", err);
        }
    };

    // Handle Project Creation
    const handleCreateProject = async () => {
        if (!projectName.trim() || !basePath) {
            alert("Please provide a name and a location.");
            return;
        }

        try {
            setLoading(true);

            // A. Create physical folder via Rust
            await invoke('create_new_project', {
                name: projectName,
                path: basePath,
                templateUrl: TEMPLATE_URL
            });

            // B. Save reference to SQLite Database
            await addProjectToDB(projectName, basePath);

            // C. Refresh UI
            await loadProjects();

            alert("Project created successfully!");
            setIsModalOpen(false);
            setProjectName("");
        }
        catch (error) {
            console.error("Creation Error:", error);
            alert(`Error: ${error}`);
        }
        finally {
            setLoading(false);
        }
    };

    // Helper to delete project (Only from DB for now)
    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering card click
        if(confirm("Remove this project from the launcher? (Files will remain)")) {
            await deleteProjectFromDB(id);
            loadProjects();
        }
    }

    const handleOpenInEditor = async (projectPath: string) => {
        try {
            const editorPath = await getSetting('default_editor_path');

            if (!editorPath) {
                if(confirm("Aucun éditeur configuré. Voulez-vous aller dans les paramètres ?")) {
                    navigate("/settings");
                }
                return;
            }

            await invoke('open_project_in_editor', {
                projectPath: projectPath,
                editorPath: editorPath
            });
        }
        catch (error) {
            console.error("Failed to open editor:", error);
            alert("Impossible d'ouvrir l'éditeur:" + error);
        }
    }

    return (
        <div className="p-8 relative min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Projects</h1>
                    <p className="text-gray-400 mt-1">Manage your local Fantasy Craft projects.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-foxvoid-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-orange-900/20 flex items-center gap-2"
                >
                    <Code size={20} /> New Project
                </button>
            </div>
            
            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Empty State */}
                {projects.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 rounded-xl text-gray-500">
                        <FolderOpen size={48} className="mb-4 opacity-50" />
                        <p>No projects found. Create one to get started!</p>
                    </div>
                )}

                {/* Project Cards */}
                {projects.map((proj) => (
                    <div 
                        key={proj.id} 
                        className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-foxvoid-orange transition group relative"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-foxvoid-orange">
                                <Code size={24} />
                            </div>
                            <button 
                                onClick={(e) => handleDelete(proj.id, e)}
                                className="text-gray-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                title="Remove from list"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-1 capitalize">{proj.name}</h3>
                        <p className="text-xs text-gray-500 font-mono truncate mb-4" title={proj.path}>
                            {proj.path}
                        </p>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => handleOpenInEditor(proj.path)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition"
                            >
                                Open Editor
                            </button>
                            <button
                                onClick={() => invoke('start_login_flow', { url: proj.path })}
                                className="px-3 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition border border-gray-700"
                                title="Open folder"
                            >
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>


            {/* Create Project Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Create New Project</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            
                            {/* Project Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                                <input 
                                    type="text" 
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value.replace(/\s+/g, '-').toLowerCase())} 
                                    placeholder="my-awesome-game"
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-foxvoid-orange focus:outline-none"
                                />
                            </div>

                            {/* Location Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={basePath}
                                        readOnly
                                        placeholder="Select a folder..."
                                        className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 opacity-70 cursor-not-allowed"
                                    />
                                    <button 
                                        onClick={selectFolder}
                                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition"
                                    >
                                        <FolderOpen size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateProject}
                                disabled={loading || !projectName || !basePath}
                                className={`px-4 py-2 rounded-lg font-bold text-white transition ${
                                    loading 
                                        ? 'bg-gray-600 cursor-wait' 
                                        : 'bg-foxvoid-orange hover:bg-orange-600 shadow-lg shadow-orange-900/20'
                                }`}
                            >
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
