
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { DepartmentMismatch } from './types';

const INITIAL_DATA: DepartmentMismatch[] = [
  { department: 'Production', metric: 'Sample Tablet Compression', plan: 5000000, actual: 4200000, variance: -800000, unit: 'Tabs', status: 'critical', reasoning: 'Initial system load. Use Data Entry to update.' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'data-entry'>('dashboard');
  const [operationData, setOperationData] = useState<DepartmentMismatch[]>(INITIAL_DATA);

  return (
    <Layout currentView={view} onViewChange={setView}>
      {view === 'dashboard' ? (
        <Dashboard data={operationData} onDataUpdate={setOperationData} />
      ) : (
        <DataEntry data={operationData} onDataUpdate={setOperationData} />
      )}
    </Layout>
  );
};

export default App;
