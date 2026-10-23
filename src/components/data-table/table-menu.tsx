'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useId, useState } from 'react';

import { DragIndicator, TableEdit } from '../icon.tsx';
import { Checkbox } from '../ui/checkbox.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { type BaseTableRow, getColumnId, type TableColumn, type VisibleColumn } from './types.ts';

interface TableMenuProps<TData extends BaseTableRow = BaseTableRow> {
  visibleColumns: VisibleColumn[];
  columns: TableColumn<TData>[];
  toggleHeaders: (id: string) => void;
  onColumnReorder?: (newOrder: string[]) => void;
}

interface SortableColumnItemProps<TData extends BaseTableRow = BaseTableRow> {
  column: TableColumn<TData>;
  isVisible: boolean;
  onToggle: (column: TableColumn<TData>) => void;
}

const SortableColumnItem = <TData extends BaseTableRow = BaseTableRow>({
  column,
  isVisible,
  onToggle,
}: SortableColumnItemProps<TData>) => {
  const columnId = getColumnId(column);
  // A generated id: a column id could match an element elsewhere on the page.
  const checkboxId = useId();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rdt-column-panel__item"
      data-dragging={isDragging || undefined}
    >
      <Checkbox id={checkboxId} checked={isVisible} onCheckedChange={() => onToggle(column)} />
      <label htmlFor={checkboxId} className="rdt-column-panel__label">
        {column.headerIcon}
        {column.header}
      </label>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${column.header}`}
        className="rdt-column-panel__handle"
        onClick={e => e.stopPropagation()}
      >
        <DragIndicator className="rdt-column-panel__handle-icon" />
      </button>
    </div>
  );
};

export const TableMenu = <TData extends BaseTableRow = BaseTableRow>({
  visibleColumns,
  columns,
  toggleHeaders,
  onColumnReorder,
}: TableMenuProps<TData>) => {
  const [localColumns, setLocalColumns] = useState<TableColumn<TData>[]>(columns);

  // Update local state when props change
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleColumnVisibilityChange = (column: TableColumn<TData>) => {
    toggleHeaders(getColumnId(column));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localColumns.findIndex(column => getColumnId(column) === active.id);
      const newIndex = localColumns.findIndex(column => getColumnId(column) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(localColumns, oldIndex, newIndex);
        setLocalColumns(newOrder);

        // Pass the new column order back to the parent
        if (onColumnReorder) {
          onColumnReorder(newOrder.map(column => getColumnId(column)));
        }
      }
    }
  };

  // A popover (role="dialog"), not a dropdown menu: the panel holds checkboxes
  // and drag handles, which a role="menu" may not contain, and a menu's focus
  // trap swallows Tab so keyboard users could never reach them.
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rdt-column-panel__trigger" aria-label="Column settings">
          <TableEdit className="rdt-column-panel__trigger-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="rdt-column-panel" align="end" sideOffset={5} aria-label="Columns">
        <div className="rdt-column-panel__list">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(column => getColumnId(column))}
              strategy={verticalListSortingStrategy}
            >
              {localColumns.map((column: TableColumn<TData>) => {
                const columnId = getColumnId(column);
                const visibleColumn = visibleColumns.find(c => c.id === columnId);
                const isVisible = visibleColumn?.visible ?? true;

                return (
                  <SortableColumnItem
                    key={columnId}
                    column={column}
                    isVisible={isVisible}
                    onToggle={handleColumnVisibilityChange}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      </PopoverContent>
    </Popover>
  );
};
