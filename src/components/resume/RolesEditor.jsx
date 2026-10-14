import React from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { GripVertical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BulletListEditor from '@/components/editors/BulletListEditor';
import BulletSuggestions from '@/components/resume/BulletSuggestions';

// The résumé's job blocks. When "sortable" each block carries a drag handle, so the candidate
// can lead with the role that answers the posting; the document follows the list's order.
export default function RolesEditor({
  roles = [],
  onChange,
  sortable = false,
  onSuggest,
  roleTitleClass = 'quiet-field font-medium',
  roleMetaClass = 'quiet-field text-[13px]'
}) {
  const update = (index, patch) => {
    const next = [...roles];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const remove = (index) => onChange(roles.filter((_, i) => i !== index));

  const add = () => onChange([...roles, { title: '', organization: '', location: '', dates: '', bullets: [''] }]);

  const reorder = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    const next = [...roles];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    onChange(next);
  };

  const cardClass = (dragging) =>
    `rounded-xl border px-4 py-4 ${
      dragging ? 'border-accent/40 bg-card shadow-lg' : 'border-border/60 bg-background/40'
    }`;

  const body = (role, index, handle) => (
    <>
      <div className="flex items-start gap-3">
        {handle}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Input
            value={role.title || ''}
            onChange={(event) => update(index, { title: event.target.value })}
            placeholder="Job title"
            className={roleTitleClass}
          />
          <Input
            value={role.organization || ''}
            onChange={(event) => update(index, { organization: event.target.value })}
            placeholder="Company"
            className={roleTitleClass}
          />
          <Input
            value={role.dates || ''}
            onChange={(event) => update(index, { dates: event.target.value })}
            placeholder="Dates"
            className={roleMetaClass}
          />
          <Input
            value={role.location || ''}
            onChange={(event) => update(index, { location: event.target.value })}
            placeholder="Location"
            className={roleMetaClass}
          />
        </div>
        <button
          type="button"
          onClick={() => remove(index)}
          className="mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Remove role"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3">
        <BulletListEditor
          items={role.bullets || []}
          onChange={(bullets) => update(index, { bullets })}
          placeholder="Add a bullet for this role"
        />
        {onSuggest ? (
          <BulletSuggestions
            role={role}
            onSuggest={onSuggest}
            onAdd={(line) => update(index, { bullets: [...(role.bullets || []), line] })}
          />
        ) : null}
      </div>
    </>
  );

  const dragHandle = (dragProvided) => (
    <button
      type="button"
      {...dragProvided.dragHandleProps}
      className="mt-1 cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
      aria-label="Drag to move this role"
      title="Drag to move this role"
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="space-y-4">
      {sortable ? (
        <DragDropContext onDragEnd={reorder}>
          <Droppable droppableId="resume-roles">
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="space-y-4">
                {roles.map((role, index) => (
                  <Draggable key={index} draggableId={`resume-role-${index}`} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={cardClass(snapshot.isDragging)}
                      >
                        {body(role, index, dragHandle(dragProvided))}
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="space-y-4">
          {roles.map((role, index) => (
            <div key={index} className={cardClass(false)}>
              {body(role, index, null)}
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" size="sm" className="rounded-full" onClick={add}>
        <Plus className="mr-2 h-3.5 w-3.5" /> Add a role
      </Button>
    </div>
  );
}