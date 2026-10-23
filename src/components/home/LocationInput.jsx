import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// The location field with suggestions below it. As the person types, matching
// communities appear underneath in "City, Province/State, Country" form:
// picking one fills the field in exactly that format. Free text still works -
// a suggestion is a convenience, not a requirement.
export default function LocationInput({ id, value, placeholder, className, onChange, required }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const skipBlur = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The city dataset is its own chunk and travels only when this field
      // is used, never with the rest of the app.
      const { searchLocations } = await import('@/lib/locations');
      const found = await searchLocations(value || '');
      if (!cancelled) {
        setOptions(found);
        setActive(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Close when a click lands outside the field or its list.
  useEffect(() => {
    const onDocClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (option) => {
    onChange(option.label);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (!open || options.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (event.key === 'Enter') {
      // Let the plain form submit flow through when nothing is offered.
      event.preventDefault();
      pick(options[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-autocomplete="list"
        autoComplete="off"
        value={value || ''}
        placeholder={placeholder}
        aria-required={required ? 'true' : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // A mousedown on an option sets this first, so a click pick works.
          if (!skipBlur.current) setOpen(false);
        }}
        onKeyDown={onKeyDown}
        className={className}
      />
      {open && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg"
        >
          {options.map((option, index) => (
            <li key={`${option.label}-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  skipBlur.current = true;
                }}
                onClick={() => {
                  pick(option);
                  skipBlur.current = false;
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] ${
                  index === active ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
