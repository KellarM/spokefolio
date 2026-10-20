import React from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { RESUME_SECTIONS } from '@/lib/resumeTemplates';
import { DEFAULT_RESUME_LAYOUT, PLACEMENTS, PORTRAIT_OPTIONS, layoutOrder, readLayout } from '@/lib/resumeLayout';

// The manual adjustments that sit on the Résumé style panel: where the heading block and the
// section headings sit, the order this résumé runs its sections in with any of them switched
// off, and whether the portrait is used. Each choice is saved on the application, and the
// preview and both downloads follow it.
export default function ResumeStyleControls({ config, layout, onChange }) {
  const current = readLayout(layout);
  const sectionOrder = layoutOrder(config, layout);
  const touched =
    current.placement !== DEFAULT_RESUME_LAYOUT.placement ||
    current.photo !== DEFAULT_RESUME_LAYOUT.photo ||
    current.hidden_sections.length > 0 ||
    current.order.length > 0;

  const pill = (active) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
      active
        ? 'border-transparent bg-primary text-primary-foreground'
        : 'border-border/70 text-muted-foreground hover:text-foreground'
    }`;

  const setPlacement = (placement) => onChange({ ...current, placement });

  const toggleSection = (id) =>
    onChange({
      ...current,
      hidden_sections: current.hidden_sections.includes(id)
        ? current.hidden_sections.filter((item) => item !== id)
        : [...current.hidden_sections, id]
    });

  const moveSection = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange({ ...current, order: next });
  };

  return (
    <div className="mt-5 space-y-5 border-t border-border/60 pt-5">
      <div>
        <p className="eyebrow">Placement</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Where your name block and the section headings sit on the page.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PLACEMENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPlacement(option.id)}
              className={pill(current.placement === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow">What shows</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Drag a section to the place you want it on this résumé, and switch off any you would rather leave out.
          Nothing is removed from your history.
        </p>

        <DragDropContext onDragEnd={moveSection}>
          <Droppable droppableId="resume-sections">
            {(drop) => (
              <ul ref={drop.innerRef} {...drop.droppableProps} className="mt-2.5 space-y-1.5">
                {sectionOrder.map((id, index) => {
                  const label = RESUME_SECTIONS[id] || id;
                  const hidden = current.hidden_sections.includes(id);
                  return (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(drag, snapshot) => (
                        <li
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${
                            snapshot.isDragging
                              ? 'border-accent/60 bg-accent/10'
                              : 'border-border/70 bg-muted/20'
                          }`}
                        >
                          <span
                            {...drag.dragHandleProps}
                            title={`Move ${label}`}
                            className="cursor-grab text-muted-foreground"
                          >
                            <GripVertical className="h-4 w-4" />
                          </span>
                          <span className={`flex-1 text-[14px] ${hidden ? 'text-muted-foreground' : ''}`}>{label}</span>
                          <button
                            type="button"
                            onClick={() => toggleSection(id)}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                              hidden
                                ? 'border-border/70 text-muted-foreground hover:text-foreground'
                                : 'border-transparent bg-primary text-primary-foreground'
                            }`}
                          >
                            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {hidden ? 'Hidden' : 'Shown'}
                          </button>
                        </li>
                      )}
                    </Draggable>
                  );
                })}
                {drop.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div>
        <p className="eyebrow">Portrait</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PORTRAIT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ ...current, photo: option.id })}
              className={pill(current.photo === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-[13px] text-muted-foreground">
          Restoring hands this résumé back to the style: its own order, every section showing.
        </p>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_RESUME_LAYOUT, hidden_sections: [], order: [] })}
          disabled={!touched}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restore to default
        </button>
      </div>
    </div>
  );
}