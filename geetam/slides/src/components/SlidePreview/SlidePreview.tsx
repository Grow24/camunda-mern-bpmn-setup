import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import useSlideStore from '../../store/slideStore';

const SlidePreview: React.FC = () => {
  const { slides, currentSlideId, isDarkMode } = useSlideStore();
  
  const currentSlide = slides.find(slide => slide.id === currentSlideId);
  const currentIndex = slides.findIndex(slide => slide.id === currentSlideId);

  if (!currentSlide) {
    return (
      <div className={`h-full flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No slide selected</p>
        </div>
      </div>
    );
  }

  // Provide fallback theme if currentSlide.theme is undefined
  const theme = currentSlide.theme || {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    textColor: isDarkMode ? '#f9fafb' : '#1f2937',
    accentColor: isDarkMode ? '#60a5fa' : '#3b82f6',
    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    useGradient: false,
    gradientFrom: undefined,
    gradientTo: undefined
  };

  const getSlideStyles = () => {
    const baseStyles: React.CSSProperties = {
      color: theme.textColor,
      borderColor: theme.borderColor,
    };

    if (theme.useGradient && theme.gradientFrom && theme.gradientTo) {
      baseStyles.background = `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`;
    } else {
      baseStyles.backgroundColor = theme.backgroundColor;
    }

    return baseStyles;
  };

  const renderContent = () => {
    if (currentSlide.contentMode === 'html') {
      const sanitizedHTML = DOMPurify.sanitize(currentSlide.content, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'div', 'span',
          'strong', 'b', 'em', 'i', 'u', 's',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'a', 'img',
          'hr'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title',
          'class', 'id', 'style',
          'target', 'rel'
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
      });

      return (
        <div 
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
          className="prose prose-lg max-w-none"
          style={{ color: 'inherit' }}
        />
      );
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={isDarkMode ? oneDark : oneLight}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code
                className={`px-1.5 py-0.5 rounded text-sm font-mono`}
                style={{
                  backgroundColor: theme.borderColor,
                  color: theme.textColor,
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-4xl font-bold mb-6 text-center border-b pb-4" style={{ borderColor: theme.borderColor }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl font-semibold mb-4 mt-8" style={{ color: theme.accentColor }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: theme.accentColor }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-lg">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 space-y-2 text-lg">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 space-y-2 text-lg list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote 
              className="border-l-4 pl-4 my-4 italic"
              style={{ borderColor: theme.accentColor }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border" style={{ borderColor: theme.borderColor }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th 
              className="border px-4 py-2 font-semibold"
              style={{ 
                borderColor: theme.borderColor,
                backgroundColor: theme.accentColor + '20'
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-4 py-2" style={{ borderColor: theme.borderColor }}>
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="underline hover:no-underline transition-all duration-200"
              style={{ color: theme.accentColor }}
            >
              {children}
            </a>
          ),
        }}
      >
        {currentSlide.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`h-full flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-inherit">
        <div>
          <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Preview
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Slide {currentIndex + 1} of {slides.length} • {currentSlide.contentMode?.toUpperCase() || 'MARKDOWN'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-8 min-h-full transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div 
            className="max-w-4xl mx-auto p-8 rounded-lg shadow-lg min-h-[600px] transition-all duration-300"
            style={getSlideStyles()}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidePreview;