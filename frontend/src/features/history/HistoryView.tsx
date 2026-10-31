import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchHistory, loadInvestigation } from './historySlice';
import { setView } from '../ui/uiSlice';
import { Icon } from '../../components/Icon';
import { Badge, Button } from '../../components/UI';

export const HistoryView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.history);

  useEffect(() => {
    dispatch(fetchHistory());
  }, [dispatch]);

  const handleSelectInvestigation = (id: string) => {
    dispatch(loadInvestigation(id));
  };

  return (
    <div className="case-canvas" style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button
            type="button"
            className="text-button"
            onClick={() => dispatch(setView('workspace'))}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
          >
            <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} />
            Back to Investigation Workspace
          </button>
          <h2>Saved Quality Investigations</h2>
          <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            Historical record of pharmaceutical API deviations, root cause analyses, and CAPA commitments.
          </p>
        </div>

        <Button
          variant="secondary"
          icon="refresh"
          disabled={status === 'loading'}
          onClick={() => dispatch(fetchHistory())}
        >
          Refresh List
        </Button>
      </div>

      {status === 'loading' && items.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
          <Icon name="clock" size={28} style={{ margin: '0 auto 12px' }} />
          <h3>Loading saved investigations...</h3>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '32px', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <p>Failed to load records: {error}</p>
          <Button variant="secondary" onClick={() => dispatch(fetchHistory())}>
            Try Again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
          <Icon name="file" size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3>No saved investigations found</h3>
          <p style={{ fontSize: '12px', marginTop: '6px' }}>
            Investigations you save in the workspace will appear here.
          </p>
          <div style={{ marginTop: '16px' }}>
            <Button
              variant="primary"
              onClick={() => dispatch(setView('workspace'))}
            >
              Go to Active Investigation
            </Button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Investigation No.</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Deviation Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Batch</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => handleSelectInvestigation(item.id)}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                    {item.investigation_no}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>
                    <strong>{item.batch_number}</strong>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge tone={item.severity === 'Critical' ? 'amber' : 'amber'}>
                      {item.severity}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge tone={item.status === 'saved' ? 'green' : 'slate'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button
                      variant="secondary"
                      icon="arrow"
                      onClick={() => handleSelectInvestigation(item.id)}
                    >
                      Open Case
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
