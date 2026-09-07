import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultFilter, type FilterState, type ParsedMessage } from "../types/chat";
import { uniqueSenders as listSenders } from "../metrics/volume";

interface FilterContextValue {
  filter: FilterState;
  setFilter: (next: FilterState | ((prev: FilterState) => FilterState)) => void;
  uniqueSenders: string[];
  messages: ParsedMessage[];
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({
  messages,
  children,
  initialFilter,
}: {
  messages: ParsedMessage[];
  children: ReactNode;
  initialFilter?: Partial<FilterState>;
}) {
  const [filter, setFilter] = useState<FilterState>({ ...defaultFilter(), ...initialFilter });
  const uniqueSenders = useMemo(() => listSenders(messages), [messages]);
  const value = useMemo(
    () => ({ filter, setFilter, uniqueSenders, messages }),
    [filter, uniqueSenders, messages],
  );
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within FilterProvider");
  return ctx;
}
