import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart3, Mic } from 'lucide-react';
import MiniDemo from './components/MiniDemo';
import LandlordView from './components/LandlordView';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <nav className="navbar">
                    <motion.div
                        className="nav-container"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="nav-brand">
                            <Home size={24} />
                            <span>Amplitude</span>
                        </div>
                        <div className="nav-links">
                            <Link to="/" className="nav-link">
                                <Mic size={20} />
                                <span>Mini Demo</span>
                            </Link>
                            <Link to="/landlord" className="nav-link">
                                <BarChart3 size={20} />
                                <span>Landlord View</span>
                            </Link>
                        </div>
                    </motion.div>
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<MiniDemo />} />
                        <Route path="/landlord" element={<LandlordView />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App; 