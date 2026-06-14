import React, { useState, useEffect, useRef } from 'react';

/**
 * A lightweight inline text editor for the canvas.
 * Falls back to normal text rendering when isEditMode is false.
 */
const EditableText = ({ 
  value, 
  onSave, 
  isEditMode, 
  tagName = 'span', 
  className = '', 
  style = {},
  placeholder = 'Type here...'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const elementRef = useRef(null);

  // When edit mode toggles off, ensure we blur and save
  useEffect(() => {
    if (!isEditMode && isFocused) {
      handleBlur();
    }
  }, [isEditMode]);

  const handleBlur = () => {
    setIsFocused(false);
    if (elementRef.current) {
      const text = elementRef.current.innerText;
      if (text !== value) {
        onSave(text);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Prevent Enter from creating new lines in single-line text fields
    if (e.key === 'Enter') {
      e.preventDefault();
      elementRef.current.blur();
    }
  };

  if (!isEditMode) {
    return React.createElement(
      tagName,
      { className, style },
      value || ''
    );
  }

  // Interactive Edit Mode
  return React.createElement(
    tagName,
    {
      ref: elementRef,
      className: `
        ${className} 
        relative outline-none transition-all duration-200 
        ${!value ? 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400' : ''}
        ${isFocused 
          ? 'bg-blue-50/80 dark:bg-blue-900/40 ring-2 ring-blue-500 rounded px-1 -mx-1 z-10' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 rounded px-1 -mx-1 cursor-text'
        }
      `,
      style: {
        ...style,
        minWidth: '20px',
        display: tagName === 'span' ? 'inline-block' : 'block'
      },
      contentEditable: true,
      suppressContentEditableWarning: true,
      'data-placeholder': placeholder,
      onFocus: () => setIsFocused(true),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      dangerouslySetInnerHTML: { __html: value || '' }
    }
  );
};

export default EditableText;
