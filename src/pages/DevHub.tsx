export default function DevHub() {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Projects</h1>
                <button className="bg-orange-700 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">
                    + New Project
                </button>
            </div>
            <p className="text-gray-400">Manage your local Fantasy Craft projects.</p>
            {/* Ici viendra la liste des projets locaux */}
        </div>
    )
}