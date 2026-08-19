'use client';
import { useState, useRef } from 'react';
import { universalDataEngine, type DatasetAnalysisResult } from '@/kernel/DataEngine';

export function DataStudioView() {
  const [analysis, setAnalysis] = useState<DatasetAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = await universalDataEngine.analyzeCsv(text, file.name);
        setAnalysis(result);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const result = await universalDataEngine.analyzeExcel(buffer, file.name);
        setAnalysis(result);
      } else {
        throw new Error('Unsupported format. Please upload a .csv, .xlsx, or .xls file.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.08em' }}>
          UNIVERSAL DATA & STATISTICAL STUDIO
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Dataset Profiling & Anomaly Engine
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Ingest raw CSV / Excel files for client-side statistical calculation (mean, median, variance, z-score outliers, and Pearson correlation coefficients).
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '1px dashed rgba(79,142,247,0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 20px',
          textAlign: 'center',
          background: 'rgba(79,142,247,0.03)',
          cursor: 'pointer',
          marginBottom: '28px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(79,142,247,0.4)')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {isProcessing ? 'Calculating descriptive statistics & anomaly curves…' : 'Click or drop CSV / Excel file here'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Supports .csv, .xlsx, .xls (Computed locally in browser runtime)
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Executive Summary Card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: '600', marginBottom: '6px' }}>
              EXECUTIVE PROFILING SUMMARY
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {analysis.executiveSummary}
            </div>
          </div>

          {/* Core Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Records</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{analysis.rowCount.toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attributes</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>{analysis.columnCount}</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Anomalies Detected</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: analysis.anomalies.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {analysis.anomalies.length}
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Correlations</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{analysis.correlations.length} pairs</div>
            </div>
          </div>

          {/* Statistical Attributes Table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Calculated Attribute Metrics
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px' }}>Column</th>
                    <th style={{ padding: '10px 14px' }}>Type</th>
                    <th style={{ padding: '10px 14px' }}>Mean</th>
                    <th style={{ padding: '10px 14px' }}>Median</th>
                    <th style={{ padding: '10px 14px' }}>Std Dev (σ)</th>
                    <th style={{ padding: '10px 14px' }}>Min / Max</th>
                    <th style={{ padding: '10px 14px' }}>Nulls</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.columns.map((col, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>{col.name}</td>
                      <td style={{ padding: '10px 14px', color: col.type === 'numeric' ? 'var(--accent)' : 'var(--text-secondary)' }}>{col.type}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{col.mean !== undefined ? col.mean.toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{col.median !== undefined ? col.median.toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{col.stdDev !== undefined ? col.stdDev.toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{col.min !== undefined ? `${col.min} / ${col.max}` : '—'}</td>
                      <td style={{ padding: '10px 14px', color: col.nullCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{col.nullCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomaly Outliers Table */}
          {analysis.anomalies.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '600', color: 'var(--warning)' }}>
                ⚠ Detected Distribution Anomalies
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px' }}>Row #</th>
                      <th style={{ padding: '10px 14px' }}>Attribute</th>
                      <th style={{ padding: '10px 14px' }}>Observed Value</th>
                      <th style={{ padding: '10px 14px' }}>Diagnostic Reason</th>
                      <th style={{ padding: '10px 14px' }}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.anomalies.map((an, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{an.rowIndex}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>{an.column}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--danger)', fontWeight: '600' }}>{String(an.value)}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{an.reason}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: an.severity === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,166,35,0.15)', color: an.severity === 'HIGH' ? 'var(--danger)' : 'var(--warning)', fontWeight: '700' }}>
                            {an.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
