import React from 'react';

interface ContextViewerProps {
  content: string;
}

export function ContextViewer({ content }: ContextViewerProps) {
  // Simple clean markdown-like parser for the curated context
  const sections = content.split('\n\n');

  return (
    <div className="bg-[#0B0D10] rounded-[8px] border border-[#262B33] p-5 font-sans text-sm leading-relaxed text-[#E8EAED] space-y-4">
      {sections.map((section, idx) => {
        const lines = section.trim().split('\n');
        const firstLine = lines[0] || '';

        if (firstLine.startsWith('### ')) {
          return (
            <div key={idx} className="space-y-2">
              <h4 className="text-sm font-semibold text-[#F5A524] uppercase tracking-wider font-mono">
                {firstLine.replace('### ', '')}
              </h4>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-[#9AA3AE]">
                {lines.slice(1).map((li, lIdx) => (
                  <li key={lIdx} className="text-[#E8EAED]/90 text-sm leading-relaxed">
                    <span dangerouslySetInnerHTML={{
                      __html: li.replace(/^- /, '')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#E8EAED] font-semibold">$1</strong>')
                        .replace(/`(.*?)`/g, '<code class="bg-[#181C22] px-1.5 py-0.5 rounded text-xs font-mono text-[#F5A524]">$1</code>')
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={idx} className="text-[#9AA3AE]">
            {section}
          </p>
        );
      })}
    </div>
  );
}
