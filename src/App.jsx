import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import ClientPortal   from './portals/client/ClientPortal';
import POS            from './portals/pos/POS';
import AdminDashboard from './portals/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client portal lives at /portal — root / serves the static marketing page */}
        <Route path="/portal/*" element={<ClientPortal />} />
        <Route path="/pos/*"    element={<POS />} />
        <Route path="/admin/*"  element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
