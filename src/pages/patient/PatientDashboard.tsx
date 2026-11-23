import React from 'react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { PatientOverview } from './PatientOverview';
import { PatientVault } from './PatientVault';
import { PatientPolicies } from './PatientPolicies';
import { PatientSubmitClaim } from './PatientSubmitClaim';
import { PatientPermissions } from './PatientPermissions';
import { PatientHistory } from './PatientHistory';
import { PatientAudit } from './PatientAudit';
import { PatientSettings } from './PatientSettings';

export const PatientDashboard: React.FC = () => {
  const { activeTab } = useArogyaZK();

  switch (activeTab) {
    case 'vault':
      return <PatientVault />;
    case 'policies':
      return <PatientPolicies />;
    case 'submit-claim':
      return <PatientSubmitClaim />;
    case 'permissions':
      return <PatientPermissions />;
    case 'history':
      return <PatientHistory />;
    case 'audit':
      return <PatientAudit />;
    case 'settings':
      return <PatientSettings />;
    case 'overview':
    default:
      return <PatientOverview />;
  }
};
