import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import {
    Building,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingUp,
    Users,
    Activity,
    Clock,
    MapPin
} from 'lucide-react';
import './LandlordView.css';

const LandlordView = () => {
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [timeRange, setTimeRange] = useState('24h');

    // Dummy data for demonstration
    const dummyUnits = [
        {
            id: '101',
            number: '101',
            tenant: 'John Smith',
            status: 'active',
            lastReading: 65.2,
            lastReadingTime: '2 minutes ago',
            violations: 2,
            avgNoiseLevel: 58.5,
            location: 'Ground Floor'
        },
        {
            id: '102',
            number: '102',
            tenant: 'Sarah Johnson',
            status: 'warning',
            lastReading: 72.8,
            lastReadingTime: '5 minutes ago',
            violations: 5,
            avgNoiseLevel: 68.2,
            location: 'Ground Floor'
        },
        {
            id: '201',
            number: '201',
            tenant: 'Mike Davis',
            status: 'violation',
            lastReading: 85.3,
            lastReadingTime: '1 minute ago',
            violations: 8,
            avgNoiseLevel: 75.1,
            location: 'Second Floor'
        },
        {
            id: '202',
            number: '202',
            tenant: 'Lisa Wilson',
            status: 'active',
            lastReading: 55.7,
            lastReadingTime: '10 minutes ago',
            violations: 0,
            avgNoiseLevel: 52.3,
            location: 'Second Floor'
        },
        {
            id: '301',
            number: '301',
            tenant: 'David Brown',
            status: 'warning',
            lastReading: 69.1,
            lastReadingTime: '3 minutes ago',
            violations: 3,
            avgNoiseLevel: 62.8,
            location: 'Third Floor'
        }
    ];

    const noiseHistoryData = [
        { time: '00:00', level: 45 },
        { time: '04:00', level: 42 },
        { time: '08:00', level: 58 },
        { time: '12:00', level: 65 },
        { time: '16:00', level: 72 },
        { time: '20:00', level: 68 },
        { time: '24:00', level: 55 }
    ];

    const violationsByUnit = [
        { unit: '101', violations: 2 },
        { unit: '102', violations: 5 },
        { unit: '201', violations: 8 },
        { unit: '202', violations: 0 },
        { unit: '301', violations: 3 }
    ];

    const statusDistribution = [
        { name: 'Acceptable', value: 2, color: '#10b981' },
        { name: 'Warning', value: 2, color: '#f59e0b' },
        { name: 'Violation', value: 1, color: '#ef4444' }
    ];

    useEffect(() => {
        setUnits(dummyUnits);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'violation': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CheckCircle size={16} />;
            case 'warning': return <AlertTriangle size={16} />;
            case 'violation': return <XCircle size={16} />;
            default: return null;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Acceptable';
            case 'warning': return 'Warning';
            case 'violation': return 'Violation';
            default: return 'Unknown';
        }
    };

    const totalUnits = units.length;
    const activeUnits = units.filter(unit => unit.status === 'active').length;
    const warningUnits = units.filter(unit => unit.status === 'warning').length;
    const violationUnits = units.filter(unit => unit.status === 'violation').length;
    const totalViolations = units.reduce((sum, unit) => sum + unit.violations, 0);

    return (
        <motion.div
            className="landlord-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="header-title">
                        <Building size={32} />
                        <div>
                            <h1>Amplitude Dashboard</h1>
                            <p>Real-time noise monitoring across all units, powered by DynamoDB and AWS Lambda</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-stats">
                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="stat-icon total">
                        <Building size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Total Units</h3>
                        <p className="stat-value">{totalUnits}</p>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="stat-icon active">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Acceptable</h3>
                        <p className="stat-value">{activeUnits}</p>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <div className="stat-icon warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Warnings</h3>
                        <p className="stat-value">{warningUnits}</p>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="stat-icon violation">
                        <XCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Violations</h3>
                        <p className="stat-value">{violationUnits}</p>
                    </div>
                </motion.div>
            </div>

            <div className="dashboard-content">
                <div className="content-left">
                    <motion.div
                        className="units-section"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <div className="section-header">
                            <h2>Unit Status</h2>
                            <span className="total-violations">{totalViolations} total violations</span>
                        </div>

                        <div className="units-grid">
                            {units.map((unit, index) => (
                                <motion.div
                                    key={unit.id}
                                    className={`unit-card ${unit.status} ${selectedUnit?.id === unit.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedUnit(unit)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 * index }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="unit-header">
                                        <div className="unit-number">Unit {unit.number}</div>
                                        <div className="unit-status" style={{ color: getStatusColor(unit.status) }}>
                                            {getStatusIcon(unit.status)}
                                            <span>{getStatusText(unit.status)}</span>
                                        </div>
                                    </div>

                                    <div className="unit-details">
                                        <div className="tenant-name">{unit.tenant}</div>
                                        <div className="unit-location">
                                            <MapPin size={14} />
                                            {unit.location}
                                        </div>
                                    </div>

                                    <div className="unit-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Last Reading</span>
                                            <span className="metric-value">{unit.lastReading} dB</span>
                                            <span className="metric-time">{unit.lastReadingTime}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Avg Level</span>
                                            <span className="metric-value">{unit.avgNoiseLevel} dB</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Violations</span>
                                            <span className="metric-value violations">{unit.violations}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <div className="content-right">
                    <motion.div
                        className="charts-section"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <div className="chart-container">
                            <h3>Noise Level Trends</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={noiseHistoryData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="level"
                                        stroke="#1D84B5"
                                        strokeWidth={3}
                                        dot={{ fill: '#1D84B5', strokeWidth: 2, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-container">
                            <h3>Violations by Unit</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={violationsByUnit}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="unit" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-container">
                            <h3>Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </div>

            {selectedUnit && (
                <motion.div
                    className="unit-detail-modal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Unit {selectedUnit.number} Details</h2>
                            <button
                                className="close-button"
                                onClick={() => setSelectedUnit(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Tenant</label>
                                    <span>{selectedUnit.tenant}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Location</label>
                                    <span>{selectedUnit.location}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span className={`status-badge ${selectedUnit.status}`}>
                                        {getStatusText(selectedUnit.status)}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Last Reading</label>
                                    <span>{selectedUnit.lastReading} dB</span>
                                </div>
                                <div className="detail-item">
                                    <label>Average Level</label>
                                    <span>{selectedUnit.avgNoiseLevel} dB</span>
                                </div>
                                <div className="detail-item">
                                    <label>Total Violations</label>
                                    <span>{selectedUnit.violations}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default LandlordView; 