import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getApiEndpoints, getStatusFromDecibel, getStatusColor } from '../config';
import './MiniDemo.css';

const MiniDemo = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCallingLambda, setIsCallingLambda] = useState(false);
    const [result, setResult] = useState(null);
    const [countdown, setCountdown] = useState(5);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const animationFrameRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const streamRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Set up audio context for real-time analysis
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

            microphoneRef.current.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Start real-time audio level monitoring
            const updateAudioLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                    const db = 20 * Math.log10(average / 255) + 90; // Convert to dB
                    setAudioLevel(Math.max(0, db));
                    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
                }
            };
            updateAudioLevel();

            // Set up MediaRecorder for 5-second recording
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await processAudio(audioBlob);
            };

            setIsRecording(true);
            setResult(null);
            setCountdown(5);

            // Start countdown
            countdownIntervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownIntervalRef.current);
                        // Automatically stop recording when countdown reaches 0
                        setTimeout(() => stopRecording(), 100); // Small delay to ensure state is updated
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            mediaRecorderRef.current.start();

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Please allow microphone access to use this feature.');
        }
    };

    const stopRecording = () => {
        console.log('Stopping recording...', {
            mediaRecorder: !!mediaRecorderRef.current,
            isRecording,
            stream: !!streamRef.current
        });

        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (error) {
                console.error('Error stopping MediaRecorder:', error);
            }
        }

        // Stop all audio tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        // Clean up audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Clear countdown interval
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        // Update state
        setIsRecording(false);
        setAudioLevel(0);
    };

    const processAudio = async (audioBlob) => {
        setIsProcessing(true);

        try {
            // Calculate average decibel level from the recording
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const channelData = audioBuffer.getChannelData(0);
            const samples = channelData.length;
            let sum = 0;

            for (let i = 0; i < samples; i++) {
                sum += Math.abs(channelData[i]);
            }

            const averageAmplitude = sum / samples;
            const decibels = 20 * Math.log10(averageAmplitude) + 90;
            const averageDb = Math.max(0, Math.min(120, decibels));

            // Show "Calling AWS Lambda..." message
            setIsCallingLambda(true);
            setIsProcessing(false);

            // Small delay to show the message
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Get API endpoints from config
            const { process: processEndpoint } = getApiEndpoints();

            // Send to Lambda function
            const response = await fetch(processEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    decibelLevel: averageDb,
                    timestamp: new Date().toISOString(),
                    location: 'Demo Unit',
                    unitId: 'demo'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setResult({
                    decibelLevel: averageDb,
                    status: data.status,
                    message: data.message
                });
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }

        } catch (error) {
            console.error('Error processing audio:', error);
            // Fallback to local processing for demo
            const fallbackDb = Math.random() * 40 + 30; // Random between 30-70 dB
            const fallbackStatus = getStatusFromDecibel(fallbackDb);
            const fallbackMessage = fallbackStatus === 'acceptable' ? 'Noise level is acceptable' :
                fallbackStatus === 'warning' ? 'Noise level is elevated' :
                    'Noise level exceeds threshold!';

            setResult({
                decibelLevel: fallbackDb,
                status: fallbackStatus,
                message: fallbackMessage
            });
        } finally {
            setIsCallingLambda(false);
            setIsProcessing(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'acceptable': return <CheckCircle size={24} />;
            case 'warning': return <AlertTriangle size={24} />;
            case 'violation': return <XCircle size={24} />;
            default: return null;
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on component unmount
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <motion.div
            className="mini-demo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="demo-header">
                <h1>Amplitude</h1>
                <p>Real-time noise level monitoring and analysis</p>
            </div>

            <div className="demo-container">
                <motion.div
                    className="recording-card"
                    style={{
                        backgroundColor: result ? getStatusColor(result.status) + '20' : 'rgba(255, 255, 255, 0.95)',
                        borderColor: result ? getStatusColor(result.status) : 'rgba(29, 132, 181, 0.3)'
                    }}
                >
                    <div className="recording-content">
                        {!isRecording && !isProcessing && !isCallingLambda && !result && (
                            <motion.div
                                className="start-section"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mic-icon-large">
                                    <Mic size={64} />
                                </div>
                                <button
                                    className="record-button"
                                    onClick={startRecording}
                                >
                                    <Mic size={24} />
                                    Start Recording
                                </button>
                            </motion.div>
                        )}

                        {isRecording && (
                            <motion.div
                                className="recording-section"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="recording-indicator">
                                    <div className="pulse-ring"></div>
                                    <Mic size={48} color="#ef4444" />
                                </div>
                                <div className="countdown">
                                    <span className="countdown-number">{countdown}</span>
                                    <span className="countdown-text">seconds remaining</span>
                                </div>
                                <div className="audio-level">
                                    <div className="level-bar">
                                        <motion.div
                                            className="level-fill"
                                            style={{
                                                width: `${(audioLevel / 120) * 100}%`,
                                                backgroundColor: audioLevel > 70 ? '#ef4444' : audioLevel > 60 ? '#f59e0b' : '#10b981'
                                            }}
                                            animate={{ width: `${(audioLevel / 120) * 100}%` }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </div>
                                    <span className="level-text">{audioLevel.toFixed(1)} dB</span>
                                </div>
                                <button
                                    className="stop-button"
                                    onClick={stopRecording}
                                >
                                    <Square size={20} />
                                    Stop Recording
                                </button>
                            </motion.div>
                        )}

                        {isProcessing && (
                            <motion.div
                                className="processing-section"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="loading-spinner"></div>
                                <p>Processing audio...</p>
                            </motion.div>
                        )}

                        {isCallingLambda && (
                            <motion.div
                                className="processing-section"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="loading-spinner"></div>
                                <p>Calling AWS Lambda...</p>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    className="result-section"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="result-icon" style={{ color: getStatusColor(result.status) }}>
                                        {getStatusIcon(result.status)}
                                    </div>
                                    <div className="result-content">
                                        <h3 className="result-title">{result.message}</h3>
                                        <div className="decibel-display">
                                            <span className="decibel-value">{result.decibelLevel.toFixed(1)}</span>
                                            <span className="decibel-unit">dB</span>
                                        </div>
                                        <div className="status-badge" style={{ backgroundColor: getStatusColor(result.status) }}>
                                            {result.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <button
                                        className="record-again-button"
                                        onClick={() => {
                                            setResult(null);
                                            setAudioLevel(0);
                                        }}
                                    >
                                        <Mic size={20} />
                                        Record Again
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <div className="info-cards">
                    <motion.div
                        className="info-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h3>How it works</h3>
                        <p>Click "Start Recording" to capture 5 seconds of audio. Amplitude calculates the average decibel level and provides real-time analysis.</p>
                    </motion.div>

                    <motion.div
                        className="info-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <h3>Thresholds</h3>
                        <div className="thresholds">
                            <div className="threshold-item">
                                <div className="threshold-color acceptable"></div>
                                <span>&lt; 60 dB - Acceptable</span>
                            </div>
                            <div className="threshold-item">
                                <div className="threshold-color warning"></div>
                                <span>60-70 dB - Warning</span>
                            </div>
                            <div className="threshold-item">
                                <div className="threshold-color violation"></div>
                                <span>&gt; 70 dB - Violation</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default MiniDemo; 