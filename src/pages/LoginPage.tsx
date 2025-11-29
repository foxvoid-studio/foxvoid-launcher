import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [status, setStatus] = useState<'idle' | 'waiting' | 'success'>('idle');
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect to Hub if authenticated (with a small delay for UX if just logged in)
    useEffect(() => {
        if (isAuthenticated) {
            const timer = setTimeout(() => {
                navigate('/', { replace: true });
            }, 1500); // 1.5s delay to let the user see the success message
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, navigate]);

    const startLogin = async () => {
        try {
            setStatus('waiting');

            // 1. Initiate Device Flow: Ask Django for a code
            // We use the Rust-backed fetch here to avoid CORS issues
            const initResponse = await fetch('http://localhost:8000/auth/device/init/', {
                method: 'POST',
            });

            if (!initResponse.ok) {
                throw new Error(`HTTP error! status: ${initResponse.status}`);
            }

            const data = await initResponse.json();
            const deviceCode = data.device_code;
            const verificationUrl = data.verification_url;

            // 2. Open browser via Rust command (using tauri-plugin-opener)
            await invoke('start_login_flow', { url: verificationUrl });

            // 3. Poll every 2 seconds
            const interval = setInterval(async () => {
                try {
                    const pollResponse = await fetch('http://localhost:8000/auth/device/poll/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ device_code: deviceCode })
                    });

                    const pollData = await pollResponse.json();

                    if (pollData.status === 'approved') {
                        clearInterval(interval);
                        console.log("Logged in! Token:", pollData.token);

                        // Update Global Context
                        // This will trigger the useEffect above to redirect
                        login(pollData.token, pollData.username, pollData.avatar_url);

                        setStatus('success');
                    } else if (pollData.status === 'expired') {
                        clearInterval(interval);
                        setStatus('idle');
                        alert("Login request exqpired.");
                    }
                } catch (pollError) {
                    console.error("Polling error:", pollError);
                }
            }, 2000);

        } catch (e) {
            console.error(e);
            setStatus('idle');
            alert("Failed to initiate login. Is the server running?");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-8">Connect to Foxvoid</h1>

            {status === 'idle' && (
                <button
                    onClick={startLogin}
                    className="bg-foxvoid-orange hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/20"
                >
                    Log in with Browser
                </button>
            )}

            {status === 'waiting' && (
                <div className="flex flex-col items-center animate-pulse">
                    <p className="mb-6 text-xl text-gray-300">Authentication in progress...</p>
                    <p className="text-sm text-gray-500 mb-8">Please approve the request in your browser.</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-foxvoid-orange"></div>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-white text-2xl font-bold">Successfully Connected!</h2>
                    <p className="text-gray-400 mt-2">Redirecting to library...</p>
                </div>
            )}
        </div>
    );
}
