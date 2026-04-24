import { createContext, useContext, useEffect, useState, useRef } from 'react';
const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDeviceActive, setIsDeviceActive] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [analytics, setAnalytics] = useState({ events: {}, avgSpeed: 0 });

  const [simActive, setSimActive] = useState(false);
  const [simType, setSimType] = useState('stationary');

  const [showPath, setShowPath] = useState(true);
  const [localPath, setLocalPath] = useState([]);

  const watchdogTimer = useRef(null);
  const wsRef = useRef(null);

  const resetWatchdog = () => {
    setIsDeviceActive(true);

    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);

    watchdogTimer.current = setTimeout(() => {
      setIsDeviceActive(false);
    }, 5000);
  };

  const sendCommand = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };
  const updateSimulation = (active, type) => {
    setSimActive(active);
    setSimType(type);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'simulation_control', active, simMode: type }));
    }
  };
  useEffect(() => {
    if (!showPath) {
      setLocalPath([]);
      return;
    }

    if (latestData?.lat && latestData?.lon) {
      setLocalPath((prevPath) => {
        const lastPoint = prevPath[prevPath.length - 1];
        if (lastPoint && lastPoint[0] === latestData.lat && lastPoint[1] === latestData.lon) {
          return prevPath;
        }
        return [...prevPath, [latestData.lat, latestData.lon]];
      });
    }
  }, [latestData, showPath]);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [historyRes, analyticsRes] = await Promise.all([
          fetch('http://localhost:8000/api/history'),
          fetch('http://localhost:8000/api/analytics')
        ]);

        const dbHistory = await historyRes.json();
        const dbAnalytics = await analyticsRes.json();

        const formattedHistory = dbHistory.map(item => ({
          id: item._id,
          timestamp: new Date(item.time).toLocaleTimeString(),
          ...item
        }));

        setHistory(formattedHistory);
        setAnalytics(dbAnalytics); 

        if (formattedHistory.length > 0) {
          setLatestData(formattedHistory[0]);
        }
      } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
      }
    };

    fetchInitialData();

    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;
    ws.onopen = () => {
      console.log('Connected to WebSocket backend');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'simulation_control', active: simActive, simMode: simType }));
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.status === "connected") return;

        if (parsedData.messageType === 'analytics') {
          setAnalytics({
            events: parsedData.events,
            avgSpeed: parsedData.avgSpeed
          });
          return;
        }
        resetWatchdog();
        const newData = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          ...parsedData
        };

        setLatestData(newData);
        setHistory((prev) => [newData, ...prev].slice(0, 50));
        setSessionLogs((prev) => [newData, ...prev].slice(0, 50));

      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    return () => {
      ws.close();
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected,setShowPath,showPath,localPath, simActive, simType, updateSimulation, sendCommand, isDeviceActive, latestData, history, sessionLogs, analytics }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);