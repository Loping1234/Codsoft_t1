import React, { useEffect, useState } from 'react';

interface SimpleSplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

const SimpleSplitText: React.FC<SimpleSplitTextProps> = ({
  text,
  className = '',
  delay = 100,
  tag = 'h1'
}) => {
  const [animatedChars, setAnimatedChars] = useState<boolean[]>([]);

  useEffect(() => {
    // Initialize all characters as not animated
    const initialState = new Array(text.length).fill(false);
    setAnimatedChars(initialState);

    // Animate characters one by one
    text.split('').forEach((_, index) => {
      setTimeout(() => {
        setAnimatedChars(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, index * delay);
    });
  }, [text, delay]);

  const renderText = () => {
    const chars = text.split('').map((char, index) => (
      <span
        key={index}
        className={`inline-block transition-all duration-700 ease-out ${
          animatedChars[index]
            ? 'opacity-100 translate-y-0 rotate-0'
            : 'opacity-0 translate-y-12 -rotate-12'
        }`}
        style={{
          transitionDelay: `${index * 50}ms`
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

    switch (tag) {
      case 'h1':
        return <h1 className={className}>{chars}</h1>;
      case 'h2':
        return <h2 className={className}>{chars}</h2>;
      case 'h3':
        return <h3 className={className}>{chars}</h3>;
      case 'h4':
        return <h4 className={className}>{chars}</h4>;
      case 'h5':
        return <h5 className={className}>{chars}</h5>;
      case 'h6':
        return <h6 className={className}>{chars}</h6>;
      case 'p':
      default:
        return <p className={className}>{chars}</p>;
    }
  };

  return renderText();
};

export default SimpleSplitText;