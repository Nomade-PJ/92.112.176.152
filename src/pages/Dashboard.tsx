import React from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useDashboardData } from '@/hooks/useDashboardData';

// Import refactored components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCardGrid from '@/components/dashboard/StatCardGrid';
import RecentServices from '@/components/dashboard/RecentServices';
import RecentCustomers from '@/components/dashboard/RecentCustomers';
import RecentDocuments from '@/components/dashboard/RecentDocuments';

const Dashboard: React.FC = () => {
  const {
    customers,
    services,
    devices,
    inventory,
    documents,
    isRefreshing,
    lastUpdated,
    handleRefresh,
    totalRevenue,
    formatLastUpdated
  } = useDashboardData();
  
  return (
    <MainLayout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardHeader 
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          formatLastUpdated={formatLastUpdated}
        />
        
        <StatCardGrid 
          services={services}
          customers={customers}
          devices={devices}
          totalRevenue={totalRevenue}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentServices services={services} />
          
          <div className="space-y-6">
            <RecentCustomers customers={customers} />
            <RecentDocuments documents={documents} />
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default Dashboard;
