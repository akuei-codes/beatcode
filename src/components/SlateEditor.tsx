
import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Code, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlateEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SlateEditor: React.FC<SlateEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Type your content here...',
  className,
}) => {
  // Convert the initial string value to Slate's format
  const initialContent: Descendant[] = useMemo(() => {
    try {
      return initialValue ? JSON.parse(initialValue) : [{ type: 'paragraph', children: [{ text: '' }] }];
    } catch (e) {
      return [{ type: 'paragraph', children: [{ text: initialValue }] }];
    }
  }, [initialValue]);

  const [value, setValue] = useState<Descendant[]>(initialContent);
  const editor = useMemo(() => withReact(createEditor()), []);

  // Define custom formatting for different text styles
  const renderLeaf = useCallback((props: any) => {
    let { attributes, children, leaf } = props;

    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.code) {
      children = <code className="px-1 py-0.5 bg-slate-800 rounded">{children}</code>;
    }

    return <span {...attributes}>{children}</span>;
  }, []);

  // Custom handler for key commands
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Apply formatting on keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b': {
          event.preventDefault();
          toggleMark('bold');
          break;
        }
        case 'i': {
          event.preventDefault();
          toggleMark('italic');
          break;
        }
        case '`': {
          event.preventDefault();
          toggleMark('code');
          break;
        }
      }
    }
  };

  // Toggle a format
  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format);
    
    if (isActive) {
      editor.removeMark(format);
    } else {
      editor.addMark(format, true);
    }
  };

  // Check if a format is currently active
  const isMarkActive = (format: string) => {
    const marks = editor.getMarks();
    return marks ? marks[format] === true : false;
  };

  // Save content
  const handleSave = () => {
    if (onChange) {
      // Convert Slate's data to a string for external use
      onChange(JSON.stringify(value));
    }
  };

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 border-b">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleMark('bold')}
          className={isMarkActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleMark('italic')}
          className={isMarkActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleMark('code')}
          className={isMarkActive('code') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="ml-auto">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      {/* Editor */}
      <Slate
        editor={editor}
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
        }}
      >
        <Editable
          className="p-3 min-h-[200px] focus:outline-none"
          placeholder={placeholder}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
        />
      </Slate>
    </div>
  );
};

export default SlateEditor;
