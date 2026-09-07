import { useState } from "react";
import { Dashboard } from "./dashboard/Dashboard";
import { LandingPage } from "./landing/LandingPage";
import { FilterProvider } from "./state/FilterProvider";
import type { ParseResult } from "./parse/parseExport";

export default function App() {
  const [bundle, setBundle] = useState<ParseResult | null>(null);

  if (!bundle) {
    return <LandingPage onParsed={setBundle} />;
  }

  return (
    <FilterProvider messages={bundle.messages}>
      <Dashboard
        messages={bundle.messages}
        warnings={bundle.warnings}
        dateOrder={bundle.dateOrder}
        onReset={() => setBundle(null)}
      />
    </FilterProvider>
  );
}
