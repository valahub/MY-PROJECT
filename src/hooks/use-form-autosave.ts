// useFormAutosave — debounced draft persistence to localStorage
//
// Automatically saves a snapshot of form data after the user stops typing
// (debounce).  On mount, exposes a `loadDraft` helper so the component can
// restore a previous draft.  Drafts expire after `ttlMs` milliseconds.

import { useEffect, useRef, useCallback, useState } from "react";

const DRAFT_PREFIX = "vala_draft_";

interface DraftRecord<T> {
  data: T;
  savedAt: number;
}

export interface UseFormAutosaveOptions {
  /** Unique key for this form (e.g. "merchant-create-product") */
  draftKey: string;
  /** Debounce delay in ms before writing to storage (default 800) */
  debounceMs?: number;
  /** Draft time-to-live in ms; expired drafts are discarded (default 7 days) */
  ttlMs?: number;
}

export interface UseFormAutosaveReturn<T> {
  /** Whether a valid (non-expired) draft exists in storage */
  hasDraft: boolean;
  /** Timestamp of the last successful save, or null if never saved */
  lastSaved: Date | null;
  /** Read the draft from storage and return it (or null if none / expired) */
  loadDraft: () => T | null;
  /** Delete the draft from storage */
  clearDraft: () => void;
}

export function useFormAutosave<T extends Record<string, unknown>>(
  /** Live form data — should be a stable object reference per render (useMemo) */
  data: T,
  options: UseFormAutosaveOptions,
): UseFormAutosaveReturn<T> {
  const { draftKey, debounceMs = 800, ttlMs = 7 * 24 * 60 * 60 * 1_000 } = options;

  const storageKey = `${DRAFT_PREFIX}${draftKey}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const writeDraft = useCallback(
    (val: T): void => {
      try {
        const record: DraftRecord<T> = { data: val, savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(record));
        setLastSaved(new Date());
        setHasDraft(true);
      } catch {
        // Storage quota or private-browsing restriction — fail silently
      }
    },
    [storageKey],
  );

  const loadDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const record: DraftRecord<T> = JSON.parse(raw);
      if (Date.now() - record.savedAt > ttlMs) {
        localStorage.removeItem(storageKey);
        setHasDraft(false);
        return null;
      }
      setHasDraft(true);
      return record.data;
    } catch {
      return null;
    }
  }, [storageKey, ttlMs]);

  const clearDraft = useCallback((): void => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [storageKey]);

  // Debounced autosave whenever form data changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => writeDraft(data), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, debounceMs, writeDraft]);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setHasDraft(true);
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hasDraft, lastSaved, loadDraft, clearDraft };
}
