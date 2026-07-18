import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminDashboard } from "./admin-dashboard";

describe("administrator dashboard", () => {
  beforeEach(() => localStorage.clear());

  it("actions a report and enables mature content", async () => {
    render(<AdminDashboard />);

    fireEvent.click(screen.getAllByRole("button", { name: "Action" })[0]);
    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      const stored = localStorage.getItem("aniverse.moderation");
      expect(stored).toContain('"status":"Actioned"');
      expect(stored).toContain('"matureContentEnabled":true');
    });
  });
});
