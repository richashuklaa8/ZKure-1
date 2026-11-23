import React from 'react';
import { ArogyaZKProvider, useArogyaZK } from './context/ArogyaZKContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/public/LandingPage';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { InsurerDashboard } from './pages/insurer/InsurerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const ArogyaZKRouter: React.FC = () => {
  const { role } = useArogyaZK();

  if (role === 'public') {
    return <LandingPage />;
  }

  return (
    <DashboardLayout>
      {role === 'patient' && <PatientDashboard />}
      {role === 'hospital' && <HospitalDashboard />}
      {role === 'insurer' && <InsurerDashboard />}
      {role === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
};

export function App() {
  return (
    <ArogyaZKProvider>
      <ArogyaZKRouter />
    </ArogyaZKProvider>
  );
}

export default App;
