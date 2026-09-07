import { useState } from "react";
import { Dashboard } from "./dashboard/Dashboard";
import { LandingPage } from "./landing/LandingPage";
import { FilterProvider } from "./state/FilterProvider";
import type { ParsedMessage } from "./types/chat";

export default function App() {
  const [bundle, setBundle] = useState<{ messages: ParsedMessage[]; warnings: string[] } | null>(
    null,
  );

  if (!bundle) {
    return (
      <LandingPage
        onParsed={(messages, warnings) => setBundle({ messages, warnings })}
      />
    );
  }

  return (
    <FilterProvider messages={bundle.messages}>
      <Dashboard
        messages={bundle.messages}
        warnings={bundle.warnings}
        onReset={() => setBundle(null)}
      />
    </FilterProvider>
  );
}
