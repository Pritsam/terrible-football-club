import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardSection, type LeaderboardEntry } from "../leaderboard/leaderboard-section";

function makeEntry(overrides: Partial<LeaderboardEntry> & { user_id: string }): LeaderboardEntry {
  return {
    name: "Player",
    avatar_url: null,
    matches_played: 1,
    goals: 0,
    assists: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    total_points: 0,
    final_rating: 0,
    mvp_count: 0,
    ...overrides,
  };
}

const CURRENT_USER = "user-1";

describe("LeaderboardSection", () => {
  it("renders empty state when no entries", () => {
    render(<LeaderboardSection entries={[]} currentUserId={CURRENT_USER} />);
    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument();
  });

  it("renders all player names", () => {
    const entries = [
      makeEntry({ user_id: "a", name: "Alice", final_rating: 5 }),
      makeEntry({ user_id: "b", name: "Bob", final_rating: 3 }),
    ];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("sorts entries by final_rating descending", () => {
    const entries = [
      makeEntry({ user_id: "a", name: "Low", final_rating: 2 }),
      makeEntry({ user_id: "b", name: "High", final_rating: 9 }),
      makeEntry({ user_id: "c", name: "Mid", final_rating: 5 }),
    ];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("High");
    expect(rows[1]).toHaveTextContent("Mid");
    expect(rows[2]).toHaveTextContent("Low");
  });

  it("breaks rating ties by goals descending", () => {
    const entries = [
      makeEntry({ user_id: "a", name: "FewGoals", final_rating: 5, goals: 1 }),
      makeEntry({ user_id: "b", name: "ManyGoals", final_rating: 5, goals: 4 }),
    ];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("ManyGoals");
    expect(rows[1]).toHaveTextContent("FewGoals");
  });

  it("marks the current user row with (you)", () => {
    const entries = [
      makeEntry({ user_id: CURRENT_USER, name: "Me", final_rating: 5 }),
      makeEntry({ user_id: "other", name: "Them", final_rating: 3 }),
    ];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    expect(screen.getByText("(you)")).toBeInTheDocument();
  });

  it("shows rank numbers starting from 1", () => {
    const entries = [
      makeEntry({ user_id: "a", name: "First", final_rating: 10 }),
      makeEntry({ user_id: "b", name: "Second", final_rating: 5 }),
    ];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    const cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("1");
  });

  it("shows MVP trophy icon and count for players with MVPs", () => {
    const entries = [makeEntry({ user_id: "a", name: "Star", mvp_count: 3, final_rating: 8 })];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows dash for players with zero MVPs", () => {
    const entries = [makeEntry({ user_id: "a", name: "NoMvp", mvp_count: 0, final_rating: 5 })];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows unknown for null player name", () => {
    const entries = [makeEntry({ user_id: "a", name: null, final_rating: 5 })];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("formats final_rating to 2 decimal places", () => {
    const entries = [makeEntry({ user_id: "a", name: "P", final_rating: 9.5, total_points: 19 })];
    render(<LeaderboardSection entries={entries} currentUserId={CURRENT_USER} />);
    expect(screen.getByText("9.50")).toBeInTheDocument();
  });
});
