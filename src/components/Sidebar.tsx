import { Gamepad2, Hammer, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
    // Retrieve user info and logout function from our Context
    const { userInfo, logout } = useAuth();

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

            {/* Bottom Actions & User Profile */}
            <div className="p-4 border-t border-gray-800 flex flex-col gap-1">
                {/* Settings Button */}
                <NavLink to="/settings" className={linkClass}>
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>

                {/* Divider */}
                <div className="h-px bg-gray-800 my-2 mx-2"></div>

                {/* User Info Section */}
                <div className="flex items-center gap-3 px-2 py-2">
                    {/* Avatar */}
                    <img 
                        src={userInfo?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} 
                        alt="User" 
                        className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                    />
                    
                    {/* Username & Status */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {userInfo?.username || "Guest"}
                        </p>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Online
                        </p>
                    </div>

                    {/* Logout Button (Icon only to save space) */}
                    <button 
                        onClick={logout}
                        title="Logout"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
