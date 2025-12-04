import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog'; // <--- Import du dialog
import { Save, Terminal, CheckCircle, FolderSearch } from "lucide-react";
import { saveSetting, getSetting } from '../lib/db';

interface EditorInfo {
    name: string;
    slug: string;
    path: string;
}

export default function Settings() {
    const [editors, setEditors] = useState<EditorInfo[]>([]);
    const [selectedEditorPath, setSelectedEditorPath] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        try {
            // 1. Detect Editors
            const detected = await invoke<EditorInfo[]>('detect_editors');
            setEditors(detected);

            // 2. Load saved preference
            const savedPath = await getSetting('default_editor_path');
            
            if (savedPath) {
                setSelectedEditorPath(savedPath);
                
                // Si le chemin sauvegardé n'est pas dans la liste détectée (ex: sélection manuelle)
                // On l'ajoute visuellement à la liste pour que l'UI reste cohérente
                const isKnown = detected.some(e => e.path === savedPath);
                if (!isKnown) {
                    const savedName = await getSetting('default_editor_name') || "Custom Editor";
                    setEditors(prev => [...prev, { name: savedName, slug: 'custom', path: savedPath }]);
                }
            } else if (detected.length > 0) {
                setSelectedEditorPath(detected[0].path);
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- NOUVELLE FONCTION : Sélection Manuelle ---
    const handleManualLocate = async () => {
        try {
            const selected = await open({
                multiple: false,
                directory: false,
                // Filtres optionnels selon l'OS, mais généralement on laisse ouvert pour les exécutables
            });

            if (selected && typeof selected === 'string') {
                const path = selected;
                // On essaie de deviner un nom joli, sinon on met le nom du fichier
                const filename = path.split(/[/\\]/).pop() || "Custom Editor";
                
                // On met à jour la liste et la sélection
                const newEditor = { name: filename, slug: 'custom-manual', path: path };
                setEditors(prev => [...prev, newEditor]);
                setSelectedEditorPath(path);
            }
        } catch (err) {
            console.error("Error picking file:", err);
        }
    };

    const handleSave = async () => {
        if (!selectedEditorPath) return;

        try {
            await saveSetting('default_editor_path', selectedEditorPath);
            const editorName = editors.find(e => e.path === selectedEditorPath)?.name || "Custom Editor";
            await saveSetting('default_editor_name', editorName);

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error("Failed to save:", e);
            alert("Error saving settings");
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400 mb-8">Customize your Foxvoid experience.</p>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-gray-900 rounded-lg text-foxvoid-orange">
                            <Terminal size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Default Code Editor</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Choose which editor to launch when opening projects.
                            </p>
                        </div>
                    </div>
                    
                    {/* Bouton de localisation manuelle */}
                    <button 
                        onClick={handleManualLocate}
                        className="text-sm flex items-center gap-2 text-foxvoid-orange hover:text-orange-400 border border-foxvoid-orange/30 hover:border-foxvoid-orange px-3 py-1.5 rounded-lg transition"
                    >
                        <FolderSearch size={16} />
                        Locate Manually
                    </button>
                </div>

                {loading ? (
                    <div className="animate-pulse h-10 bg-gray-700 rounded w-full"></div>
                ) : (
                    <div className="space-y-3">
                        {editors.length > 0 ? (
                            editors.map((editor) => (
                                <label 
                                    key={editor.path} // Utiliser le path comme clé car le slug peut être dupliqué en manuel
                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                                        selectedEditorPath === editor.path 
                                        ? 'border-foxvoid-orange bg-orange-900/10' 
                                        : 'border-gray-700 hover:bg-gray-700/50'
                                    }`}
                                >
                                    <input 
                                        type="radio" 
                                        name="editor" 
                                        value={editor.path}
                                        checked={selectedEditorPath === editor.path}
                                        onChange={(e) => setSelectedEditorPath(e.target.value)}
                                        className="w-4 h-4 text-foxvoid-orange focus:ring-foxvoid-orange bg-gray-900 border-gray-600"
                                    />
                                    <div className="ml-4 flex-1">
                                        <span className="block text-white font-medium">{editor.name}</span>
                                        <span className="block text-xs text-gray-500 font-mono mt-0.5 break-all">
                                            {editor.path}
                                        </span>
                                    </div>
                                    {selectedEditorPath === editor.path && (
                                        <CheckCircle size={20} className="text-foxvoid-orange" />
                                    )}
                                </label>
                            ))
                        ) : (
                            <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700 border-dashed">
                                <p className="text-gray-400 mb-2">No editors found automatically.</p>
                                <button onClick={handleManualLocate} className="text-foxvoid-orange hover:underline">
                                    Click here to select an executable manually
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={loading || !selectedEditorPath}
                    className="flex items-center gap-2 bg-foxvoid-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg shadow-orange-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                    {saved ? "Saved!" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
