import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Column<T> {
  key?: string;
  accessorKey?: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  searchable?: boolean;
  searchKey?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void | Promise<void>;
  getItemLabel?: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  title,
  searchable = true,
  searchKey,
  pageSize = 10,
  onRowClick,
  onEdit,
  onDelete,
  getItemLabel,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [localData, setLocalData] = useState<T[]>(data);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const effectiveData = onDelete ? localData : data;
  const hasActions = !!(onEdit || onDelete);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const resolvedColumns = columns.map((col) => ({
    ...col,
    _key: col.key || col.accessorKey || col.header,
  }));

  const filtered =
    searchable && searchKey
      ? effectiveData.filter((item) =>
          String((item as Record<string, unknown>)[searchKey])
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : searchable
        ? effectiveData.filter((item) => {
            if (!search) return true;
            return Object.values(item as Record<string, unknown>).some((v) =>
              String(v).toLowerCase().includes(search.toLowerCase()),
            );
          })
        : effectiveData;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    if (totalPages === 0 && page !== 0) {
      setPage(0);
      return;
    }

    if (totalPages > 0 && page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const renderCell = (col: (typeof resolvedColumns)[0], item: T) => {
    if (col.cell) return col.cell({ row: { original: item } });
    if (col.render) return col.render(item);
    return String((item as Record<string, unknown>)[col._key] ?? "");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteLoading) return;
    const label = getItemLabel ? getItemLabel(deleteTarget) : "Item";
    setDeleteLoading(true);
    try {
      await onDelete?.(deleteTarget);
      setLocalData((prev) => prev.filter((x) => x !== deleteTarget));
      toast.success(`${label} deleted`);
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed. Please retry.";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const content = (
    <>
      {searchable && (
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {resolvedColumns.map((col) => (
                <TableHead key={col._key}>{col.header}</TableHead>
              ))}
              {hasActions && <TableHead className="w-12 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={resolvedColumns.length + (hasActions ? 1 : 0)}
                  className="text-center text-muted-foreground py-8"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item, i) => (
                <TableRow
                  key={i}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                >
                  {resolvedColumns.map((col) => (
                    <TableCell key={col._key}>{renderCell(col, item)}</TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget && getItemLabel ? getItemLabel(deleteTarget) : "this item"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div>{content}</div>;
}
