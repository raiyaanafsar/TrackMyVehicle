import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import ChartsPage from './pages/ChartsPage';
import LogsPage from './pages/LogsPage';
import { WebSocketProvider } from './context/WebSocketContext'; 

function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MapPage />} />
            <Route path="charts" element={<ChartsPage />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;