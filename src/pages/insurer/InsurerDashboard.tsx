import React from 'react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { InsurerOverview } from './InsurerOverview';
import { InsurerIncomingClaims } from './InsurerIncomingClaims';
import { InsurerZKVerify } from './InsurerZKVerify';
import { InsurerApprovedClaims } from './InsurerApprovedClaims';
import { InsurerSettlements } from './InsurerSettlements';
import { InsurerRiskMonitoring } from './InsurerRiskMonitoring';
import { InsurerAudit } from './InsurerAudit';

export const InsurerDashboard: React.FC = () => {
  const { activeTab } = useArogyaZK();

  switch (activeTab) {
    case 'incoming':
      return <InsurerIncomingClaims />;
    case 'zk-verify':
      return <InsurerZKVerify />;
    case 'approved':
      return <InsurerApprovedClaims />;
    case 'settlements':
      return <InsurerSettlements />;
    case 'risk':
      return <InsurerRiskMonitoring />;
    case 'audit':
      return <InsurerAudit />;
    case 'overview':
    default:
      return <InsurerOverview />;
  }
};
