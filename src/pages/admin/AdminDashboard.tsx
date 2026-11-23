import React from 'react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { AdminOverview } from './AdminOverview';
import { AdminHospitals } from './AdminHospitals';
import { AdminContracts } from './AdminContracts';
import { AdminExplorer } from './AdminExplorer';
import { AdminAudit } from './AdminAudit';

export const AdminDashboard: React.FC = () => {
  const { activeTab } = useArogyaZK();

  switch (activeTab) {
    case 'hospitals':
      return <AdminHospitals />;
    case 'contracts':
      return <AdminContracts />;
    case 'explorer':
      return <AdminExplorer />;
    case 'audit':
      return <AdminAudit />;
    case 'overview':
    default:
      return <AdminOverview />;
  }
};
