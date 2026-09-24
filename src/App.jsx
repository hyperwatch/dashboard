import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ViewProvider } from './lib/ViewContext';
import { InstanceProvider } from './lib/InstanceContext';
import { RequestDetailProvider } from './lib/RequestDetailContext';
import Overview from './pages/Overview';
import Addresses from './pages/Addresses';
import Signatures from './pages/Signatures';
import Identities from './pages/Identities';
import Fingerprint from './pages/Fingerprint';
import Firewall from './pages/Firewall';
import Logs from './pages/Logs';
import Status from './pages/Status';
import Nodes from './pages/Nodes';

export default function App() {
  return (
    <InstanceProvider>
      <ViewProvider>
        <RequestDetailProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Overview />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="signatures" element={<Signatures />} />
              <Route path="identities" element={<Identities />} />
              <Route path="fingerprint" element={<Fingerprint />} />
              <Route path="firewall" element={<Firewall />} />
              <Route path="logs" element={<Logs />} />
              <Route path="nodes" element={<Nodes />} />
              <Route path="status" element={<Status />} />
            </Route>
          </Routes>
        </RequestDetailProvider>
      </ViewProvider>
    </InstanceProvider>
  );
}
