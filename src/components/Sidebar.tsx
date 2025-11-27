import { Gamepad2, Hammer, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
            ? 'bg-orange-800 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`;

    return (
        <div className="w-64 bg-gray-900 h-screen flex flex-col border-r border-gray-800">
            {/* Logo Area */}
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white">
                    Fox<span className="text-orange-800">void</span>
                </h1>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Launcher Alpha</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                <NavLink to="/" className={linkClass}>
                    <Gamepad2 size={20} />
                    <span className="font-medium">Play</span>
                </NavLink>

                <NavLink to="/create" className={linkClass}>
                    <Hammer size={20} />
                    <span className="font-medium">Create</span>
                </NavLink>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-800">
                <button className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white w-full">
                    <Settings size={20} />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );
}