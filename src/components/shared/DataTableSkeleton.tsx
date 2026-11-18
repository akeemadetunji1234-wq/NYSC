import { Skeleton } from "../ui/skeleton";

export function DataTableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} aria-hidden="true">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <td key={columnIndex} className="px-4 py-4">
              <Skeleton className={columnIndex === 0 ? "h-4 w-32" : columnIndex === columns - 1 ? "ml-auto h-8 w-20" : "h-4 w-24"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
