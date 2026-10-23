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
import { useEffect, useState } from 'react';

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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md hover:bg-muted p-2"
    >
      <Checkbox
        id={columnId}
        checked={isVisible}
        onCheckedChange={() => onToggle(column)}
        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />
      <label htmlFor={columnId} className="cursor-pointer flex-1 inline-flex items-center gap-1">
        {column.headerIcon}
        {column.header}
      </label>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${column.header}`}
        className="flex bg-transparent border-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1"
        onClick={e => e.stopPropagation()}
      >
        <DragIndicator className="h-4 w-4" />
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
        <button
          type="button"
          className="flex items-center justify-center bg-transparent border-0 cursor-pointer p-0 w-6 h-6"
          aria-label="Column settings"
        >
          <TableEdit />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-100 max-h-[50vh] overflow-y-auto"
        align="end"
        sideOffset={5}
        aria-label="Columns"
      >
        <div className="flex flex-col">
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
