import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SecuritySettings } from "./security-settings";

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => false }));

describe("SecuritySettings", () => {
  it("shows password and session controls", () => {
    render(<SecuritySettings />);
    expect(screen.getByRole("heading", { name: "Password & sessions" })).toBeInTheDocument();
    expect(screen.getByText("This browser")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update password" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out everywhere" })).toBeInTheDocument();
  });
});
