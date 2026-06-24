import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ReceptionistPage from './pages/ReceptionistPage';
import WaitingRoomPage from './pages/WaitingRoomPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/receptionist" replace />} />
          <Route path="/receptionist" element={<ReceptionistPage />} />
          <Route path="/waiting-room" element={<WaitingRoomPage />} />
          <Route path="*" element={<Navigate to="/receptionist" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
