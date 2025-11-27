import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PlayHub from "./pages/PlayHub";
import DevHub from "./pages/DevHub";
import "./App.css"

function App() {
    return(
        <BrowserRouter>
            <div className="flex h-screen bg-gray-800 text-white">
                {/* Navigation gauche permanente */}
                <Sidebar />

                {/* Zone de contenu principale qui change */}
                <main className="flex-1 overflow-auto bg-gray-950">
                    <Routes>
                        <Route path="/" element={<PlayHub />} />
                        <Route path="/create" element={<DevHub />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;