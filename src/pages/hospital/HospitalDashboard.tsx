import React from 'react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { HospitalOverview } from './HospitalOverview';
import { HospitalPatients } from './HospitalPatients';
import { HospitalAuthorizedRecords } from './HospitalAuthorizedRecords';
import { HospitalCreateClaim } from './HospitalCreateClaim';
import { HospitalVerification } from './HospitalVerification';
import { HospitalSubmittedClaims } from './HospitalSubmittedClaims';
import { HospitalProfile } from './HospitalProfile';

export const HospitalDashboard: React.FC = () => {
  const { activeTab } = useArogyaZK();

  switch (activeTab) {
    case 'patients':
      return <HospitalPatients />;
    case 'authorized':
      return <HospitalAuthorizedRecords />;
    case 'create-claim':
      return <HospitalCreateClaim />;
    case 'verification':
      return <HospitalVerification />;
    case 'submitted':
      return <HospitalSubmittedClaims />;
    case 'profile':
      return <HospitalProfile />;
    case 'overview':
    default:
      return <HospitalOverview />;
  }
};
