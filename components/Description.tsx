import React from 'react';

interface DescriptionProps {
  text: string;
}

const Description: React.FC<DescriptionProps> = ({ text }) => {
  // The AI provides a description with bullet points, typically separated by newlines.
  // The previous logic `text.split('* ')` was not robust for different AI outputs.
  // This new logic splits by newline, filters out empty lines, and removes common bullet
  // characters like '*' or '-' from the beginning of each line to ensure proper display.
  const listItems = text
    .split('\n')
    .map(item => item.trim().replace(/^[\*\-]\s*/, ''))
    .filter(item => item.length > 0);

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700 h-full">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">Proposed Topology</h3>
      <ul className="space-y-3 text-gray-300">
        {listItems.map((item, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-5 w-5 mr-3 mt-1 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Description;