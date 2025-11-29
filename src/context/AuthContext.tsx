import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Define the shape of the user data
interface UserInfo {
    username: string,
    avatar: string
}

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    userInfo: UserInfo | null;
    login: (token: string, username: string, avatar: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
        const storedUser = localStorage.getItem('auth_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const navigate = useNavigate();
    const location = useLocation();

    // Check valid token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUserInfo(JSON.parse(storedUser));
        }
        else {
            // If no token and not already on login page, redirect
            if (location.pathname !== '/login') {
                navigate('/login');
            }
        }
    }, []);

    const login = (newToken: string, newUsername: string, newAvatar: string) => {
        const newUserInfo = { username: newUsername, avatar: newAvatar };

        // Save to localStorage
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUserInfo));

        // Update State
        setToken(newToken);
        setUserInfo(newUserInfo);
    };

    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        setToken(null);
        setUserInfo(null);

        navigate('/login');
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, userInfo, login, logout }}>
            { children }
        </AuthContext.Provider>
    );
}

// Custom hook for easy access
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
