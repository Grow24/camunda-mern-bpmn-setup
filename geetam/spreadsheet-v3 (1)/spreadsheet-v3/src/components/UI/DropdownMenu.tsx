import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: DropdownItem[];
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSubmenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48">
          {items.map((item, index) => (
            <div key={index}>
              {item.separator && <div className="border-t border-gray-200 my-1" />}
              <div
                className={`relative px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                }`}
                onClick={() => {
                  if (!item.disabled && !item.submenu) {
                    item.onClick();
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => {
                  if (item.submenu) {
                    setSubmenuOpen(index);
                  }
                }}
                onMouseLeave={() => {
                  if (item.submenu) {
                    setSubmenuOpen(null);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.submenu && <span className="ml-2">▶</span>}
                </div>
                
                {item.submenu && submenuOpen === index && (
                  <div className="absolute left-full top-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48">
                    {item.submenu.map((subItem, subIndex) => (
                      <div
                        key={subIndex}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                          subItem.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                        }`}
                        onClick={() => {
                          if (!subItem.disabled) {
                            subItem.onClick();
                            setIsOpen(false);
                            setSubmenuOpen(null);
                          }
                        }}
                      >
                        {subItem.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};