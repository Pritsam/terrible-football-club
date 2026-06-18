import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchMvp, type MvpEntry } from "../matches/match-mvp";

function makeEntry(overrides: Partial<MvpEntry> & { player_id: string }): MvpEntry {
  return {
    points: 10,
    goals: 2,
    assists: 1,
    name: "Player",
    ...overrides,
  };
}

describe("MatchMvp", () => {
  it("renders nothing when mvps array is empty", () => {
    const { container } = render(<MatchMvp mvps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders single MVP heading without tied label", () => {
    const mvps = [makeEntry({ player_id: "a", name: "Alice" })];
    render(<MatchMvp mvps={mvps} />);
    expect(screen.getByText("Match MVP")).toBeInTheDocument();
    expect(screen.queryByText(/tied/i)).not.toBeInTheDocument();
  });

  it("renders multiple MVPs with tied label", () => {
    const mvps = [
      makeEntry({ player_id: "a", name: "Alice" }),
      makeEntry({ player_id: "b", name: "Bob" }),
    ];
    render(<MatchMvp mvps={mvps} />);
    expect(screen.getByText("Match MVPs")).toBeInTheDocument();
    expect(screen.getByText(/tied/i)).toBeInTheDocument();
  });

  it("renders MVP player name", () => {
    const mvps = [makeEntry({ player_id: "a", name: "Alice" })];
    render(<MatchMvp mvps={mvps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders fallback name when name is undefined", () => {
    const mvps = [makeEntry({ player_id: "a", name: undefined })];
    render(<MatchMvp mvps={mvps} />);
    expect(screen.getByText("Unknown player")).toBeInTheDocument();
  });

  it("renders points, goals and assists for the MVP", () => {
    const mvps = [makeEntry({ player_id: "a", points: 11, goals: 3, assists: 2 })];
    render(<MatchMvp mvps={mvps} />);
    expect(screen.getByText(/11pts/)).toBeInTheDocument();
    expect(screen.getByText(/3G/)).toBeInTheDocument();
    expect(screen.getByText(/2A/)).toBeInTheDocument();
  });

  it("renders all names when multiple MVPs are tied", () => {
    const mvps = [
      makeEntry({ player_id: "a", name: "Alice" }),
      makeEntry({ player_id: "b", name: "Bob" }),
      makeEntry({ player_id: "c", name: "Carol" }),
    ];
    render(<MatchMvp mvps={mvps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });
});
