import React, { useState } from 'react';

/* Button Component */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'web3' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  label?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  label,
  className = '',
  ...props
}) => {
  return (
    <button className={`sc-btn sc-btn-${variant} sc-btn-${size} ${className}`} {...props}>
      {icon && <span className="sc-btn-icon">{icon}</span>}
      {children || label}
    </button>
  );
};

/* GlassCard Component */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ glow = false, children, className = '', ...props }) => {
  return (
    <div className={`sc-glass-card ${glow ? 'sc-glow' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

/* Badge Component */
export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'web3';
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', pulse = false, children, className = '' }) => {
  return (
    <span className={`sc-badge sc-badge-${variant} ${className}`}>
      {pulse && <span className="sc-pulse-dot" />}
      {children}
    </span>
  );
};

/* Wallet Badge Component */
export interface WalletBadgeProps {
  address: string;
  network?: string;
  onCopy?: () => void;
}

export const WalletBadge: React.FC<WalletBadgeProps> = ({ address, network = 'Polygon Amoy', onCopy }) => {
  const [copied, setCopied] = useState(false);

  const formatAddr = (addr: string) => {
    if (!addr) return 'did:pkh:eip155:80002:...';
    if (addr.startsWith('did:pkh:')) {
      const parts = addr.split(':');
      const evm = parts[parts.length - 1];
      return `did:pkh:...${evm.slice(-4)}`;
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sc-wallet-badge" onClick={handleCopy} title={`Click to copy: ${address}`}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#C084FC' }} />
      <span>{formatAddr(address)}</span>
      <span style={{ fontSize: '0.7rem', opacity: 0.75, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
        {copied ? 'Copied!' : network}
      </span>
    </div>
  );
};

/* StatsCard Component */
export interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtext, icon, trend, trendValue }) => {
  return (
    <GlassCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="sc-stat-card">
          <span className="sc-stat-title">{title}</span>
          <span className="sc-stat-value">{value}</span>
          {(subtext || trendValue) && (
            <div className="sc-stat-sub">
              {trendValue && (
                <span style={{ color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF', fontWeight: 600 }}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
                </span>
              )}
              {subtext && <span>{subtext}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div style={{ padding: 10, background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#6366F1' }}>
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

/* Modal Component */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal-header">
          <h3 className="sc-modal-title">{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>
        <div className="sc-modal-body">{children}</div>
        {footer && <div className="sc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

/* Tabs Component */
export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8, marginBottom: 20 }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: isActive ? '#6366F1' : '#9CA3AF',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 10, background: isActive ? '#6366F1' : 'rgba(255,255,255,0.1)', color: '#FFF' }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
