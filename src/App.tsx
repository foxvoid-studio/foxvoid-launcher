import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PlayHub from "./pages/PlayHub";
import DevHub from "./pages/DevHub";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

// 1. Layout for authenticated users (Sidebar + Content)
const ProtectedLayout = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-gray-800 text-white">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-gray-950 relative">
                <Outlet />
            </main>
        </div>
    );
};

// 2. Wrapper to handle the Context (Router must wrap Provider)
function AppRoutes() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<PlayHub />} />
                    <Route path="/create" element={<DevHub />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

// 3. Main App Entry
function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;