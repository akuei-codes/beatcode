
import React, { useState } from 'react';
import SlateEditor from './SlateEditor';

interface TextEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  initialValue = '', 
  onChange,
  placeholder = 'Start typing...',
  height = '300px',
  className = ''
}) => {
  const [content, setContent] = useState(initialValue);

  const handleChange = (value: string) => {
    setContent(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={className} style={{ height }}>
      <SlateEditor
        initialValue={content}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-full"
      />
    </div>
  );
};

export default TextEditor;
