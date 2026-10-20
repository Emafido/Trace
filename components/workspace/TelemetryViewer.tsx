import React from 'react';

interface TelemetryViewerProps {
  log: string;
}

export function TelemetryViewer({ log }: TelemetryViewerProps) {
  return (
    <div className="bg-[#0B0D10] rounded-[8px] border border-[#262B33] p-4 font-mono text-[13px] md:text-[14px] leading-relaxed overflow-x-auto">
      <pre className="text-[#E8EAED] whitespace-pre selection:bg-[#F5A524]/20 selection:text-[#F5A524]">
        {log.split('\n').map((line, idx) => {
          let lineStyle = 'text-[#E8EAED]';
          if (line.includes('INFO')) {
            lineStyle = 'text-[#7EE787]';
          } else if (line.includes('DEBUG')) {
            lineStyle = 'text-[#79C0FF]';
          } else if (line.includes('metrics') || line.includes('---')) {
            lineStyle = 'text-[#9AA3AE] font-semibold';
          } else if (line.includes('duplicate_ledger_references') || line.includes('support_tickets')) {
            lineStyle = 'text-[#FFA198] font-semibold';
          }

          return (
            <div key={idx} className={`py-0.5 ${lineStyle}`}>
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
