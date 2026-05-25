import React from "react";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3 font-poppins text-slate-700 leading-relaxed break-words">
      {blocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={blockIndex} className="text-xs font-bold text-slate-800 mt-3 mb-1 uppercase tracking-wider">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={blockIndex} className="text-[13.5px] font-bold text-indigo-700 mt-4 mb-1 border-b border-indigo-50/50 pb-1">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={blockIndex} className="text-sm font-bold text-indigo-800 mt-4 mb-2">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        if (trimmed.includes("|") && trimmed.split("\n")[0].includes("|")) {
          const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
          if (lines.length >= 2) {
            const rows = lines.map(line => 
              line.split("|")
                .map(cell => cell.trim())
                .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            );
            
            const hasSeparator = rows[1]?.every(cell => cell.startsWith("-") || cell.includes("-"));
            if (hasSeparator) {
              const headers = rows[0];
              const dataRows = rows.slice(2);
              return (
                <div key={blockIndex} className="my-3 overflow-x-auto rounded-xl border border-slate-100/80 shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-100 text-xs text-left bg-white">
                    <thead className="bg-slate-50/80 text-slate-600 font-semibold font-poppins">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-3.5 py-2 border-b border-slate-100/60 font-medium">
                            {renderInline(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-poppins">
                      {dataRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50/40 transition-colors">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3.5 py-2 whitespace-normal border-r border-slate-50 last:border-0">
                              {renderInline(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          }
        }

        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
          const lines = trimmed.split("\n").filter(Boolean);
          const isNumbered = /^\d+\.\s/.test(lines[0]);
          
          const listItems = lines.map((line, idx) => {
            const listContent = isNumbered 
              ? line.replace(/^\d+\.\s/, "") 
              : line.replace(/^[\*\-]\s/, "");
            return (
              <li key={idx} className="relative pl-4 text-slate-600 text-[13px] leading-relaxed">
                {isNumbered ? (
                  <span className="absolute left-0 text-[11px] font-bold text-indigo-500 font-mono">
                    {idx + 1}.
                  </span>
                ) : (
                  <span className="absolute left-1.5 top-2 h-1 w-1 rounded-full bg-indigo-500" />
                )}
                {renderInline(listContent)}
              </li>
            );
          });

          return (
            <ul key={blockIndex} className="space-y-1 my-2 pl-1">
              {listItems}
            </ul>
          );
        }

        const lines = trimmed.split("\n");
        return (
          <p key={blockIndex} className="text-[13px] text-slate-600 leading-relaxed">
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  if (!text) return "";
  
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded text-[11px] font-mono font-medium border border-slate-200/40">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
