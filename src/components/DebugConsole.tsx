import React, { useState, useEffect } from 'react';

export const DebugConsole: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Override console methods to capture logs
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addLog = (type: string, args: any[]) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            setLogs(prev => [`[${type}] ${message}`, ...prev].slice(0, 50)); // Keep last 50 logs
        };

        console.log = (...args) => {
            originalLog(...args);
            addLog('LOG', args);
        };

        console.error = (...args) => {
            originalError(...args);
            addLog('ERR', args);
        };

        console.warn = (...args) => {
            originalWarn(...args);
            addLog('WRN', args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    if (!isVisible) {
        return (
            <button
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: '1px solid #d4af37',
                    padding: '5px 10px',
                    borderRadius: '4px'
                }}
                onClick={() => setIsVisible(true)}
            >
                Show Debug Logs
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '50vh',
            background: 'rgba(0,0,0,0.9)',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 9999,
            overflowY: 'auto',
            borderTop: '2px solid #d4af37',
            padding: '10px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                borderBottom: '1px solid #333',
                paddingBottom: '5px'
            }}>
                <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Debug Console</span>
                <button
                    onClick={() => setIsVisible(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                    ✕ Close
                </button>
            </div>
            {logs.map((log, i) => (
                <div key={i} style={{
                    marginBottom: '4px',
                    borderBottom: '1px solid #111',
                    color: log.startsWith('[ERR]') ? '#ff4444' : log.startsWith('[WRN]') ? '#ffbb33' : '#0f0'
                }}>
                    {log}
                </div>
            ))}
        </div>
    );
};
