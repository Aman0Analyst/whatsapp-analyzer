import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("shows the landing page until a file is parsed", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /whatsapp analyzer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a \.txt export/i)).toBeInTheDocument();
  });

  it("opens the dashboard after a successful parse and can reset", async () => {
    const user = userEvent.setup();
    render(<App />);
    const file = new File(["14/10/18, 11:16 - Ada: hi\n14/10/18, 11:17 - Bob: yo\n"], "chat.txt", {
      type: "text/plain",
    });
    Object.defineProperty(file, "text", {
      value: async () => "14/10/18, 11:16 - Ada: hi\n14/10/18, 11:17 - Bob: yo\n",
    });
    await user.upload(screen.getByLabelText(/choose a \.txt export/i), file);
    expect(await screen.findByText(/two-person chat/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /analyze another file/i }));
    expect(screen.getByLabelText(/choose a \.txt export/i)).toBeInTheDocument();
  });
});
