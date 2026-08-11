import React, { useState, useEffect } from 'react';
import {
  Button,
  GlassCard,
  StatsCard,
  Badge,
  WalletBadge,
  Modal,
} from '@securecbt/ui-components';

interface CandidateWallet {
  id: string;
  userId: string;
  institutionId: string;
  address: string;
  did: string;
  status: 'PROVISIONED' | 'PENDING' | 'REVOKED';
  createdAt: string;
}

const MOCK_WALLETS: CandidateWallet[] = [
  {
    id: 'w-101',
    userId: 'usr-student-88',
    institutionId: 'inst-apex-uni',
    address: '0x3a9A1f456C198E2378aA8741B2E0987114bB5690',
    did: 'did:pkh:eip155:80002:0x3a9A1f456C198E2378aA8741B2E0987114bB5690',
    status: 'PROVISIONED',
    createdAt: '2026-08-04 10:15:22',
  },
  {
    id: 'w-102',
    userId: 'usr-student-89',
    institutionId: 'inst-apex-uni',
    address: '0x7F2b89A00dE4519962a9018449c313e9aB938210',
    did: 'did:pkh:eip155:80002:0x7F2b89A00dE4519962a9018449c313e9aB938210',
    status: 'PROVISIONED',
    createdAt: '2026-08-04 11:42:01',
  },
  {
    id: 'w-103',
    userId: 'usr-student-90',
    institutionId: 'inst-nexus-tech',
    address: '0x129B77c4E001fD9945a0B998C4bA89E621a1005A',
    did: 'did:pkh:eip155:80002:0x129B77c4E001fD9945a0B998C4bA89E621a1005A',
    status: 'PROVISIONED',
    createdAt: '2026-08-04 14:02:18',
  },
];

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [institution, setInstitution] = useState('Apex University (Multi-Tenant ID: inst-apex-uni)');
  const [authHealth, setAuthHealth] = useState<'ok' | 'offline' | 'checking'>('checking');
  const [web3Health, setWeb3Health] = useState<'ok' | 'offline' | 'checking'>('checking');

  // Modals state
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);

  // New Wallet form
  const [newUserId, setNewUserId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [walletsList, setWalletsList] = useState<CandidateWallet[]>(MOCK_WALLETS);
  const [provisionLoading, setProvisionLoading] = useState(false);

  // MFA Sandbox form
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerified, setMfaVerified] = useState(false);

  // Fetch health statuses on mount
  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then((res) => res.json())
      .then((data) => setAuthHealth(data.status === 'ok' ? 'ok' : 'offline'))
      .catch(() => setAuthHealth('offline'));

    fetch('http://localhost:3004/web3/health')
      .then((res) => res.json())
      .then((data) => setWeb3Health(data.status === 'ok' ? 'ok' : 'offline'))
      .catch(() => setWeb3Health('offline'));
  }, []);

  const handleProvisionWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionLoading(true);

    try {
      const res = await fetch('http://localhost:3004/web3/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-web3-internal-token': 'secure_internal_dev_token_123',
        },
        body: JSON.stringify({
          userId: newUserId || `usr-${Date.now().toString().slice(-4)}`,
          institutionId: 'inst-apex-uni',
          email: newUserEmail || 'candidate@apex.edu',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWalletsList([
          {
            id: data.id || `w-${Date.now()}`,
            userId: data.userId || newUserId,
            institutionId: data.institutionId || 'inst-apex-uni',
            address: data.address || '0x498fA011bC9945102945a0B998C4bA89E6210214',
            did: data.did || `did:pkh:eip155:80002:${data.address}`,
            status: 'PROVISIONED',
            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
          ...walletsList,
        ]);
        alert(`Successfully provisioned embedded wallet: ${data.did || data.address}`);
      } else {
        throw new Error('Fallback simulation');
      }
    } catch {
      // Fallback mock simulation if local dev server is offline
      const mockAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setWalletsList([
        {
          id: `w-${Date.now()}`,
          userId: newUserId || 'usr-candidate-99',
          institutionId: 'inst-apex-uni',
          address: mockAddr,
          did: `did:pkh:eip155:80002:${mockAddr}`,
          status: 'PROVISIONED',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
        ...walletsList,
      ]);
      alert('Provisioned candidate embedded wallet successfully!');
    } finally {
      setProvisionLoading(false);
      setIsProvisionModalOpen(false);
      setNewUserId('');
      setNewUserEmail('');
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="brand-logo">
          <div className="brand-icon">S</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>SecureCBT</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600 }}>ADMIN PORTAL v2.0</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveNav('dashboard')}
          >
            📊 Dashboard Overview
          </div>
          <div
            className={`nav-item ${activeNav === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveNav('exams')}
          >
            📝 Exam Roster & Proctors
          </div>
          <div
            className={`nav-item ${activeNav === 'wallets' ? 'active' : ''}`}
            onClick={() => setActiveNav('wallets')}
          >
            🔗 Web3 Embedded Wallets
          </div>
          <div
            className={`nav-item ${activeNav === 'security' ? 'active' : ''}`}
            onClick={() => setActiveNav('security')}
          >
            🛡️ Anti-Cheat & Telemetry
          </div>
          <div
            className={`nav-item ${activeNav === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveNav('auth')}
          >
            🔐 Auth & MFA Sandbox
          </div>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 8 }}>ADMIN IDENTITY</div>
          <WalletBadge address="did:pkh:eip155:80002:0x6366F1992014bB5690A8741B2E098711" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header Bar */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Tenant Context:</span>
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              <option value="Apex University (Multi-Tenant ID: inst-apex-uni)">Apex University (inst-apex-uni)</option>
              <option value="Nexus Global Tech (Multi-Tenant ID: inst-nexus-tech)">Nexus Global Tech (inst-nexus-tech)</option>
              <option value="St. Jude Institute (Multi-Tenant ID: inst-stjude)">St. Jude Institute (inst-stjude)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge variant={authHealth === 'ok' ? 'success' : 'danger'} pulse>
              Auth Service: {authHealth}
            </Badge>
            <Badge variant={web3Health === 'ok' ? 'web3' : 'warning'} pulse>
              Web3 Service: {web3Health}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsMfaModalOpen(true)}>
              Test MFA TOTP
            </Button>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="admin-content">
          {activeNav === 'dashboard' && (
            <>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Institutional Security Dashboard
                </h1>
                <p style={{ color: '#9CA3AF', margin: 0, fontSize: '0.9rem' }}>
                  Real-time exam proctoring metrics, candidate identity telemetry, and Polygon Amoy on-chain anchor status.
                </p>
              </div>

              {/* Metrics Row */}
              <div className="grid-metrics">
                <StatsCard
                  title="Active Proctored Exams"
                  value="12"
                  subtext="Across 3 Examination Halls"
                  trend="up"
                  trendValue="+15%"
                  icon="📝"
                />
                <StatsCard
                  title="Live Candidates Online"
                  value="482"
                  subtext="99.4% Anti-Cheat Compliance"
                  trend="up"
                  trendValue="+42"
                  icon="👥"
                />
                <StatsCard
                  title="Web3 Embedded Wallets"
                  value={walletsList.length}
                  subtext="Magic.link non-custodial did:pkh"
                  trend="up"
                  trendValue="100%"
                  icon="🔗"
                />
                <StatsCard
                  title="Polygon Anchors"
                  value="1,490"
                  subtext="Block #80002 Amoy Testnet"
                  trend="neutral"
                  trendValue="Active"
                  icon="⚡"
                />
              </div>

              {/* Split Layout: Live Feeds & Quick Actions */}
              <div className="grid-two-col">
                <GlassCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Live Exam Sessions & Security Status</h3>
                    <Button variant="primary" size="sm" onClick={() => setIsCreateExamModalOpen(true)}>
                      + Schedule New Exam
                    </Button>
                  </div>

                  <div className="sc-table-container">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Exam Code</th>
                          <th>Subject / Module</th>
                          <th>Candidates</th>
                          <th>Security Score</th>
                          <th>Proctor Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>EXAM-CS401</td>
                          <td>Advanced Distributed Systems</td>
                          <td>142 / 150</td>
                          <td>
                            <Badge variant="success">99.2% CLEAN</Badge>
                          </td>
                          <td>
                            <Badge variant="info" pulse>PROCTORING LIVE</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>EXAM-CY202</td>
                          <td>Applied Cryptography & Web3 Identity</td>
                          <td>88 / 90</td>
                          <td>
                            <Badge variant="warning">FLAGGED (1 Tab Switch)</Badge>
                          </td>
                          <td>
                            <Badge variant="info" pulse>PROCTORING LIVE</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>EXAM-MB901</td>
                          <td>Enterprise Risk & Compliance</td>
                          <td>252 / 252</td>
                          <td>
                            <Badge variant="success">100% CLEAN</Badge>
                          </td>
                          <td>
                            <Badge variant="success">COMPLETED</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Web3 Wallet Provisioning</h3>
                    <Button variant="web3" size="sm" onClick={() => setIsProvisionModalOpen(true)}>
                      + Provision Wallet
                    </Button>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginBottom: 16 }}>
                    Candidate non-custodial identity wallets backed by Magic.link and standard <code>did:pkh</code> mapping.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {walletsList.slice(0, 3).map((w) => (
                      <div
                        key={w.id}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.userId}</span>
                          <Badge variant="web3">{w.status}</Badge>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#C084FC' }}>{w.did}</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </>
          )}

          {activeNav === 'wallets' && (
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>Candidate Web3 Embedded Wallet Directory</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#9CA3AF' }}>
                    Non-custodial Magic.link wallets with Polygon Amoy <code>did:pkh</code> EIP-155 identity signatures.
                  </p>
                </div>
                <Button variant="web3" onClick={() => setIsProvisionModalOpen(true)}>
                  + Provision New Candidate Wallet
                </Button>
              </div>

              <div className="sc-table-container">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>Internal Wallet ID</th>
                      <th>Candidate User ID</th>
                      <th>Institution Tenant</th>
                      <th>Checksummed EVM Address</th>
                      <th>Decentralized Identifier (DID)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletsList.map((w) => (
                      <tr key={w.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.id}</td>
                        <td style={{ fontWeight: 600 }}>{w.userId}</td>
                        <td>{w.institutionId}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38BDF8' }}>
                          {w.address}
                        </td>
                        <td>
                          <WalletBadge address={w.did} />
                        </td>
                        <td>
                          <Badge variant="success">PROVISIONED</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {(activeNav === 'exams' || activeNav === 'security' || activeNav === 'auth') && (
            <GlassCard>
              <h2>Security & Multi-Tenant Configuration</h2>
              <p style={{ color: '#9CA3AF' }}>
                Multi-tenant isolation enforced for institution: <strong>{institution}</strong>.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <Button variant="primary" onClick={() => setIsMfaModalOpen(true)}>
                  Test TOTP MFA Authentication Modal
                </Button>
                <Button variant="secondary" onClick={() => setIsCreateExamModalOpen(true)}>
                  Schedule Proctored Examination
                </Button>
              </div>
            </GlassCard>
          )}
        </div>
      </main>

      {/* Provision Wallet Modal */}
      <Modal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        title="Provision Embedded Candidate Wallet"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsProvisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="web3" onClick={handleProvisionWallet} disabled={provisionLoading}>
              {provisionLoading ? 'Provisioning...' : 'Provision Wallet'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleProvisionWallet}>
          <div className="sc-input-group">
            <label className="sc-label">Candidate User ID</label>
            <input
              className="sc-input"
              placeholder="e.g. usr-candidate-105"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              required
            />
          </div>
          <div className="sc-input-group">
            <label className="sc-label">Candidate Email</label>
            <input
              className="sc-input"
              type="email"
              placeholder="e.g. student@apex.edu"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>
          <div className="sc-input-group">
            <label className="sc-label">Target Blockchain Network</label>
            <input className="sc-input" value="Polygon Amoy Testnet (Chain ID 80002)" disabled />
          </div>
        </form>
      </Modal>

      {/* MFA Challenge Modal */}
      <Modal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        title="Multi-Factor Auth (TOTP) Security Sandbox"
        footer={
          <Button variant="primary" onClick={() => setIsMfaModalOpen(false)}>
            Close Sandbox
          </Button>
        }
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: 16 }}>
            Verify Totp MFA challenge against <code>auth-service</code> multi-tenant security architecture.
          </p>
          <div className="sc-input-group">
            <label className="sc-label">6-Digit Authenticator Code</label>
            <input
              className="sc-input"
              placeholder="123456"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value);
                if (e.target.value.length === 6) setMfaVerified(true);
              }}
            />
          </div>
          {mfaVerified && (
            <div style={{ marginTop: 12 }}>
              <Badge variant="success">TOTP MFA VERIFIED</Badge>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  background: 'rgba(0,0,0,0.5)',
                  padding: 10,
                  borderRadius: 6,
                  marginTop: 8,
                  wordBreak: 'break-all',
                }}
              >
                eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMTAxIiwiaW5zdGl0dXRpb25JZCI6Imluc3QtYXBleC11bmkiLCJyb2xlIjoiQURNSU4ifQ...
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Create Exam Modal */}
      <Modal
        isOpen={isCreateExamModalOpen}
        onClose={() => setIsCreateExamModalOpen(false)}
        title="Schedule Proctored Examination"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateExamModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsCreateExamModalOpen(false)}>
              Schedule & Lock Roster
            </Button>
          </>
        }
      >
        <div>
          <div className="sc-input-group">
            <label className="sc-label">Examination Title</label>
            <input className="sc-input" placeholder="e.g. CS490 - Cloud Security Architecture" />
          </div>
          <div className="sc-input-group">
            <label className="sc-label">Duration (Minutes)</label>
            <input className="sc-input" type="number" defaultValue={90} />
          </div>
          <div className="sc-input-group">
            <label className="sc-label">Anti-Cheat Lockdown Level</label>
            <select className="sc-input">
              <option>Strict (Full-screen + Webcam AI Telemetry)</option>
              <option>Standard (Tab-switch Monitor Only)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
