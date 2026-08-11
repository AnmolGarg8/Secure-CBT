import React, { useState, useEffect } from 'react';
import {
  Button,
  GlassCard,
  Badge,
  WalletBadge,
  Modal,
  Tabs,
} from '@securecbt/ui-components';

interface Question {
  id: number;
  title: string;
  codeSnippet?: string;
  options: { key: string; text: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'In a Byzantine Fault Tolerant (BFT) consensus mechanism, what is the maximum fraction of malicious nodes a network can tolerate while maintaining safety and liveness?',
    codeSnippet: `// BFT Consensus Threshold Check
func ValidateBFTThreshold(totalNodes int, maliciousNodes int) bool {
    return maliciousNodes < (totalNodes / 3)
}`,
    options: [
      { key: 'A', text: 'Less than 1/2 of total nodes (< 50%)' },
      { key: 'B', text: 'Less than 1/3 of total nodes (< 33.3%)' },
      { key: 'C', text: 'Less than 1/4 of total nodes (< 25%)' },
      { key: 'D', text: 'Exactly 2/3 of total nodes (== 66.6%)' },
    ],
  },
  {
    id: 2,
    title: 'Which Web3 Decentralized Identifier (DID) method standardizes EVM wallet address mapping using EIP-155 chain specifications?',
    codeSnippet: `did:pkh:eip155:80002:0x3a9A1f456C198E2378aA8741B2E0987114bB5690`,
    options: [
      { key: 'A', text: 'did:key' },
      { key: 'B', text: 'did:pkh' },
      { key: 'C', text: 'did:ethr' },
      { key: 'D', text: 'did:web' },
    ],
  },
  {
    id: 3,
    title: 'How does Multi-Tenant isolation prevent cross-tenant data leakage in a microservice database architecture?',
    options: [
      { key: 'A', text: 'By enforcing mandatory institutionId foreign key filtering on every query context' },
      { key: 'B', text: 'By storing all tenant passwords in plain text' },
      { key: 'C', text: 'By disabling SSL transport security' },
      { key: 'D', text: 'By routing all read queries to a single global public bucket' },
    ],
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workspace');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: number]: string }>({});
  const [flagged, setFlagged] = useState<{ [qId: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(5340); // 1h 29m
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Timer tick effect
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (key: string) => {
    setAnswers({ ...answers, [QUESTIONS[currentQIndex].id]: key });
  };

  const toggleFlag = () => {
    const qId = QUESTIONS[currentQIndex].id;
    setFlagged({ ...flagged, [qId]: !flagged[qId] });
  };

  const currentQ = QUESTIONS[currentQIndex];
  const selectedAnswer = answers[currentQ.id];
  const isCurrentFlagged = !!flagged[currentQ.id];

  return (
    <div className="candidate-layout">
      {/* Candidate Top Navigation Header */}
      <header className="candidate-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #10B981, #0EA5E9)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
            }}
          >
            C
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Apex University Candidate Workspace</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Candidate: Alex Rivera (ID: usr-student-88)</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Badge variant="success" pulse>
            PROCTORING LIVE (CAM ACTIVE)
          </Badge>
          <div className="timer-box">
            <span>⏱️</span>
            <span>{formatTimer(timeLeft)}</span>
          </div>
          <WalletBadge address="did:pkh:eip155:80002:0x3a9A1f456C198E2378aA8741B2E0987114bB5690" />
        </div>
      </header>

      {/* Main Container */}
      <main className="candidate-main">
        <Tabs
          tabs={[
            { id: 'workspace', label: '📝 Live Proctored Exam', badge: 'Active' },
            { id: 'credentials', label: '🏆 My Web3 Credentials', badge: '2 Verifiable' },
            { id: 'wallet', label: '💳 Non-Custodial Wallet' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'workspace' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Anti-Cheat Security Banner */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                <span>
                  <strong>Full Lockdown Proctored Session:</strong> Anti-cheat telemetry active. Do not switch tabs or leave screen focus.
                </span>
              </div>
              <Badge variant="info">SECURITY SCORE: 100%</Badge>
            </div>

            {/* Split Grid: Question Palette & Main Workspace */}
            <div className="exam-split-grid">
              {/* Question Navigator */}
              <GlassCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>Question Palette</h3>
                <div className="question-palette">
                  {QUESTIONS.map((q, idx) => {
                    const isAns = !!answers[q.id];
                    const isFlg = !!flagged[q.id];
                    const isCurr = currentQIndex === idx;

                    let statusClass = '';
                    if (isCurr) statusClass = 'active';
                    else if (isFlg) statusClass = 'flagged';
                    else if (isAns) statusClass = 'answered';

                    return (
                      <button
                        key={q.id}
                        className={`palette-btn ${statusClass}`}
                        onClick={() => setCurrentQIndex(idx)}
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem', color: '#9CA3AF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366F1' }} />
                    <span>Current Question</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }} />
                    <span>Answered ({Object.keys(answers).length})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }} />
                    <span>Flagged for Review ({Object.keys(flagged).filter((k) => flagged[Number(k)]).length})</span>
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <Button variant="danger" style={{ width: '100%' }} onClick={() => setIsSubmitModalOpen(true)}>
                    Submit Final Examination
                  </Button>
                </div>
              </GlassCard>

              {/* Main Question Card */}
              <GlassCard style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question {currentQIndex + 1} of {QUESTIONS.length}
                    </span>
                    <Button variant={isCurrentFlagged ? 'warning' : 'outline'} size="sm" onClick={toggleFlag}>
                      {isCurrentFlagged ? '🚩 Flagged' : '🏳️ Flag for Review'}
                    </Button>
                  </div>

                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.4, margin: '0 0 16px 0' }}>
                    {currentQ.title}
                  </h2>

                  {currentQ.codeSnippet && (
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '14px 18px',
                        fontFamily: 'var(--sc-font-mono)',
                        fontSize: '0.85rem',
                        color: '#A5B4FC',
                        marginBottom: 20,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {currentQ.codeSnippet}
                    </div>
                  )}

                  {/* Options */}
                  <div style={{ marginTop: 20 }}>
                    {currentQ.options.map((opt) => {
                      const isSelected = selectedAnswer === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(opt.key)}
                        >
                          <div className="option-key">{opt.key}</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{opt.text}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Navigation */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Button
                    variant="secondary"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(currentQIndex - 1)}
                  >
                    ← Previous
                  </Button>

                  {currentQIndex < QUESTIONS.length - 1 ? (
                    <Button variant="primary" onClick={() => setCurrentQIndex(currentQIndex + 1)}>
                      Next Question →
                    </Button>
                  ) : (
                    <Button variant="web3" onClick={() => setIsSubmitModalOpen(true)}>
                      Finish & Anchor Submission
                    </Button>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>Verifiable On-Chain Credentials</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9CA3AF' }}>
                  Cryptographically signed exam completion proofs anchored to Polygon Amoy Testnet (Chain ID 80002).
                </p>
              </div>
              <Badge variant="web3">Polygon Amoy Testnet</Badge>
            </div>

            <div className="sc-table-container">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Certificate Title</th>
                    <th>Institution</th>
                    <th>Grade / Score</th>
                    <th>Polygon Tx Hash</th>
                    <th>DID Signature</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Advanced Distributed Systems (CS401)</td>
                    <td>Apex University</td>
                    <td>98.5% (High Honors)</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#38BDF8' }}>
                      0x8f2a991b004278e...
                    </td>
                    <td>
                      <WalletBadge address="did:pkh:eip155:80002:0x3a9A1f456C198E2378aA8741B2E0987114bB5690" />
                    </td>
                    <td>
                      <Badge variant="success">VERIFIED ON-CHAIN</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Applied Cryptography Certification</td>
                    <td>Nexus Global Tech</td>
                    <td>100.0% (Perfect Score)</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#38BDF8' }}>
                      0x147b02998a10427...
                    </td>
                    <td>
                      <WalletBadge address="did:pkh:eip155:80002:0x3a9A1f456C198E2378aA8741B2E0987114bB5690" />
                    </td>
                    <td>
                      <Badge variant="success">VERIFIED ON-CHAIN</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {activeTab === 'wallet' && (
          <GlassCard>
            <h2>My Non-Custodial Embedded Wallet</h2>
            <p style={{ color: '#9CA3AF', marginBottom: 20 }}>
              Transparently provisioned via Magic.link Node SDK. No seed phrase required, enterprise cryptographic safety.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Wallet DID:</span>
                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#C084FC', marginTop: 4 }}>
                  did:pkh:eip155:80002:0x3a9A1f456C198E2378aA8741B2E0987114bB5690
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>EVM Checksummed Address:</span>
                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#38BDF8', marginTop: 4 }}>
                  0x3a9A1f456C198E2378aA8741B2E0987114bB5690
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Final Examination"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Back to Questions
            </Button>
            <Button
              variant="web3"
              onClick={() => {
                setSubmitted(true);
                setIsSubmitModalOpen(false);
                alert('Exam submitted & cryptographically anchored on-chain!');
              }}
            >
              Confirm & Submit
            </Button>
          </>
        }
      >
        <div>
          <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>
            You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{QUESTIONS.length}</strong> questions.
          </p>
          {Object.keys(flagged).some((k) => flagged[Number(k)]) && (
            <Badge variant="warning">
              Warning: You have questions marked for review!
            </Badge>
          )}
          <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginTop: 16 }}>
            Submitting will lock your responses and anchor your submission hash to the Polygon Amoy blockchain.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default App;
