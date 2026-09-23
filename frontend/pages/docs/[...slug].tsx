import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Callout, CalloutType } from '@/components/docs/Callout';
import { DOC_ARTICLES, DocArticle, getDocArticle } from '@/lib/docsContent';

interface DocPageProps {
  article: DocArticle;
  slug: string[];
}

export default function DocPage({ article }: DocPageProps) {
  if (!article) return null;

  // Comprehensive inline formatter: handles math ($...$), code (`...`), bold (**...**), italics (*...*), and links ([...](...))
  const renderMathFormula = (formula: string): React.ReactNode => {
    let s = formula
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\cdot/g, ' · ')
      .replace(/\\times/g, ' × ')
      .replace(/\\rightarrow/g, ' → ')
      .replace(/\\approx/g, ' ≈ ')
      .replace(/\\le/g, ' ≤ ')
      .replace(/\\ge/g, ' ≥ ')
      .replace(/\\pm/g, ' ± ')
      .replace(/\\%/g, '%')
      .replace(/\\_/g, '_');

    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
    s = s.replace(/\\mathbf\{([^}]+)\}/g, '$1');
    s = s.replace(/\\text\{([^}]+)\}/g, '$1');

    const parts: React.ReactNode[] = [];
    const subRegex = /([A-Za-z0-9]+)_(\{([^\}]+)\}|([A-Za-z0-9]+))/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let partCount = 0;

    while ((match = subRegex.exec(s)) !== null) {
      if (match.index > lastIdx) {
        parts.push(s.substring(lastIdx, match.index));
      }
      const base = match[1];
      const sub = match[3] || match[4];
      parts.push(
        <span key={`sub-${partCount++}`}>
          {base}
          <sub className="text-[10px] font-mono leading-none bottom-0 font-normal text-stone-700">{sub}</sub>
        </span>
      );
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < s.length) {
      parts.push(s.substring(lastIdx));
    }

    return parts.length > 0 ? <>{parts}</> : s;
  };

  const formatInline = (text: string): React.ReactNode => {
    if (!text) return '';
    // Regex matching: Math ($...$), Code (`...`), Bold (**...**), Links ([...](...)), Italics (*...*)
    const tokenRegex = /(\$([^\$]+)\$|`([^`]+)`|\*\*([^\*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*([^\*]+)\*)/g;
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push(text.substring(lastIndex, match.index));
      }

      const key = `inline-${count++}`;

      if (match[2]) {
        // Math: $...$
        result.push(
          <span 
            key={key} 
            className="inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded bg-stone-100 border border-stone-200/90 font-mono text-[11.5px] font-semibold text-forest-900 shadow-2xs tracking-wide"
          >
            {renderMathFormula(match[2])}
          </span>
        );
      } else if (match[3]) {
        // Code: `...`
        result.push(
          <code 
            key={key} 
            className="px-1.5 py-0.5 mx-0.5 rounded bg-stone-100 text-forest-900 border border-stone-200/80 font-mono text-[11px] font-medium"
          >
            {match[3]}
          </code>
        );
      } else if (match[4]) {
        // Bold: **...**
        result.push(
          <strong key={key} className="font-bold text-stone-900">
            {formatInline(match[4])}
          </strong>
        );
      } else if (match[5] && match[6]) {
        // Link: [text](url)
        result.push(
          <a 
            key={key} 
            href={match[6]} 
            className="text-forest-800 hover:text-forest-900 underline underline-offset-2 font-medium transition-colors"
          >
            {match[5]}
          </a>
        );
      } else if (match[7]) {
        // Italic: *...*
        result.push(
          <em key={key} className="italic text-stone-800">
            {match[7]}
          </em>
        );
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }

    return result.length === 1 ? result[0] : <>{result}</>;
  };

  // Full-featured document parser
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = 'bash';

    let inTable = false;
    let tableBuffer: string[] = [];

    let bulletBuffer: string[] = [];
    let numberedBuffer: { num: string; text: string }[] = [];

    const flushCodeBlock = (key: number) => {
      elements.push(
        <CodeBlock 
          key={`code-${key}`} 
          code={codeBuffer.join('\n')} 
          language={codeLang} 
        />
      );
      codeBuffer = [];
      inCodeBlock = false;
    };

    const flushTable = (key: number) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        inTable = false;
        return;
      }
      const headerRow = tableBuffer[0].split('|').map(s => s.trim()).filter(Boolean);
      const dataRows = tableBuffer.slice(2).map(r => r.split('|').map(s => s.trim()).filter(Boolean));

      elements.push(
        <div key={`table-${key}`} className="my-6 overflow-x-auto rounded border border-stone-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 uppercase font-mono text-[10px] border-b border-stone-200">
              <tr>
                {headerRow.map((h, i) => (
                  <th key={i} className="py-2.5 px-3.5 font-bold">{formatInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800 bg-white">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-stone-50/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3.5 font-mono text-[11px] leading-relaxed">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    };

    const flushBullets = (key: number) => {
      if (bulletBuffer.length === 0) return;
      elements.push(
        <ul key={`ul-${key}`} className="my-3.5 space-y-2 pl-5 list-disc marker:text-forest-700 text-stone-700 text-xs sm:text-sm">
          {bulletBuffer.map((bText, bIdx) => (
            <li key={bIdx} className="leading-relaxed">
              {formatInline(bText)}
            </li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    };

    const flushNumbered = (key: number) => {
      if (numberedBuffer.length === 0) return;
      elements.push(
        <ol key={`ol-${key}`} className="my-3.5 space-y-2.5 text-stone-700 text-xs sm:text-sm">
          {numberedBuffer.map((item, nIdx) => (
            <li key={nIdx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="h-5 w-5 rounded bg-forest-100 text-forest-900 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-forest-200">
                {item.num}
              </span>
              <span className="pt-0.5">{formatInline(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      numberedBuffer = [];
    };

    const flushLists = (key: number) => {
      flushBullets(key);
      flushNumbered(key);
    };

    lines.forEach((line, idx) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        flushLists(idx);
        if (inCodeBlock) {
          flushCodeBlock(idx);
        } else {
          inCodeBlock = true;
          codeLang = line.trim().replace('```', '') || 'text';
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Tables
      if (line.trim().startsWith('|')) {
        flushLists(idx);
        inTable = true;
        tableBuffer.push(line);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Display Math ($$ ... $$)
      if (line.trim().startsWith('$$')) {
        flushLists(idx);
        const mathContent = line.trim().replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '');
        if (mathContent) {
          elements.push(
            <div 
              key={`mathblock-${idx}`} 
              className="my-5 p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-center font-mono text-xs sm:text-sm font-bold text-forest-900 shadow-2xs overflow-x-auto"
            >
              <span className="inline-block py-1 px-3 bg-white rounded border border-stone-200/80 shadow-2xs">
                {renderMathFormula(mathContent)}
              </span>
            </div>
          );
          return;
        }
      }

      // Callouts / Blockquotes
      if (line.trim().startsWith('>')) {
        flushLists(idx);
        const quoteText = line.replace(/^>\s*/, '');
        let calloutType: CalloutType = 'NOTE';
        if (quoteText.includes('SAFETY') || quoteText.includes('CRITICAL')) calloutType = 'SAFETY';
        else if (quoteText.includes('IMPORTANT') || quoteText.includes('CORE')) calloutType = 'IMPORTANT';
        else if (quoteText.includes('WARNING')) calloutType = 'WARNING';
        else if (quoteText.includes('TIP')) calloutType = 'TIP';

        elements.push(
          <Callout key={`quote-${idx}`} type={calloutType}>
            {formatInline(quoteText)}
          </Callout>
        );
        return;
      }

      // Headings
      if (line.startsWith('## ')) {
        flushLists(idx);
        const headingText = line.replace('## ', '').trim();
        const headingId = headingText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

        elements.push(
          <h2 
            key={`h2-${idx}`} 
            id={headingId} 
            className="text-xl font-bold text-stone-900 mt-10 mb-4 font-sans pt-3 border-t border-stone-200 first:border-none first:pt-0"
          >
            {formatInline(headingText)}
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushLists(idx);
        const headingText = line.replace('### ', '').trim();
        const headingId = headingText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

        elements.push(
          <h3 
            key={`h3-${idx}`} 
            id={headingId} 
            className="text-lg font-bold text-stone-900 mt-8 mb-3 font-sans pt-2 border-t border-stone-100 first:border-none first:pt-0"
          >
            {formatInline(headingText)}
          </h3>
        );
        return;
      }

      if (line.startsWith('#### ')) {
        flushLists(idx);
        const headingText = line.replace('#### ', '').trim();
        elements.push(
          <h4 key={`h4-${idx}`} className="text-sm font-bold text-stone-900 mt-5 mb-2 font-mono">
            {formatInline(headingText)}
          </h4>
        );
        return;
      }

      // Horizontal dividers
      if (line.trim() === '---') {
        flushLists(idx);
        elements.push(<hr key={`hr-${idx}`} className="my-6 border-stone-200" />);
        return;
      }

      // Bullet points (- or * or •)
      if (/^[-*•]\s+/.test(line.trim())) {
        flushNumbered(idx);
        const itemText = line.trim().replace(/^[-*•]\s+/, '');
        bulletBuffer.push(itemText);
        return;
      }

      // Numbered lists (1. , 2. )
      if (/^\d+\.\s+/.test(line.trim())) {
        flushBullets(idx);
        const match = line.trim().match(/^(\d+)\.\s+(.*)$/);
        if (match) {
          numberedBuffer.push({ num: match[1], text: match[2] });
          return;
        }
      }

      // Empty lines
      if (!line.trim()) {
        flushLists(idx);
        return;
      }

      // Normal paragraph
      flushLists(idx);
      elements.push(
        <p key={`p-${idx}`} className="my-3.5 text-stone-700 text-xs sm:text-sm leading-relaxed">
          {formatInline(line)}
        </p>
      );
    });

    flushLists(lines.length);
    if (inCodeBlock) flushCodeBlock(lines.length);
    if (inTable) flushTable(lines.length);

    return elements;
  };

  return (
    <DocsLayout
      title={article.title}
      category={article.category}
      subtitle={article.subtitle}
      lastUpdated={article.lastUpdated}
      readTime={article.readTime}
      headings={article.headings}
    >
      <div className="prose prose-stone max-w-none">
        {renderContent(article.content)}
      </div>
    </DocsLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const directSlugs = Object.keys(DOC_ARTICLES).map(key => ({
    params: { slug: key.split('/') }
  }));

  // Also pre-generate aliases
  const aliasKeys = [
    ['getting-started'],
    ['system-overview'],
    ['quick-start'],
    ['dashboard-guide'],
    ['hardware'],
    ['operating'],
    ['data'],
    ['models'],
    ['operators'],
    ['developers'],
    ['troubleshooting'],
    ['hardware', 'troubleshooting']
  ];

  const allPaths = [...directSlugs, ...aliasKeys.map(slug => ({ params: { slug } }))];

  return {
    paths: allPaths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string[];
  const article = getDocArticle(slug);

  if (!article) {
    return { notFound: true };
  }

  return {
    props: {
      article,
      slug
    }
  };
};

