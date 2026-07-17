import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorTip } from "./creator-tip";
describe("CreatorTip",()=>{it("makes voluntary pricing and the zero platform fee clear",()=>{render(<CreatorTip creatorTeamId="10000000-0000-4000-8000-000000000001" titleId="20000000-0000-4000-8000-000000000001" creatorName="Lumen Works"/>);expect(screen.getByRole("heading",{name:"Send Lumen Works a tip"})).toBeInTheDocument();expect(screen.getByText(/Watching is always free/)).toBeInTheDocument();expect(screen.getByText(/0% platform fee/)).toBeInTheDocument();expect(screen.getByRole("button",{name:"Continue to secure checkout"})).toBeEnabled()})});
