import React from 'react';
import { HealthCheckResponse } from '@securecbt/shared-types';
import { Button } from '@securecbt/ui-components';

const App: React.FC = () => {
  const healthResponse: HealthCheckResponse = { status: 'ok' };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>SecureCBT Admin Portal</h1>
      <p>Status from shared-types: {healthResponse.status}</p>
      <div style={{ marginTop: '20px' }}>
        <Button label="Dashboard Button from UI Lib" onClick={() => alert('Clicked!')} />
      </div>
    </div>
  );
};

export default App;
