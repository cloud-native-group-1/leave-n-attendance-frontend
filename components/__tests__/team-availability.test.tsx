import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TeamAvailability } from "../team-availability";
import { getTeamMembersOnLeaveToday } from "@/lib/services/team";

// Mock the UI components
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

// Mock the team service
jest.mock("@/lib/services/team", () => ({
  getTeamMembersOnLeaveToday: jest.fn(),
}));

const mockGetTeamMembersOnLeaveToday = getTeamMembersOnLeaveToday as jest.MockedFunction<typeof getTeamMembersOnLeaveToday>;

describe("TeamAvailability Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton initially", () => {
    mockGetTeamMembersOnLeaveToday.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<TeamAvailability />);
    
    expect(screen.getAllByTestId("skeleton")).toHaveLength(10); // Based on actual skeleton structure
  });

  it("displays team availability data correctly", async () => {
    const mockData = {
      onLeaveMembers: [
        {
          id: 1,
          user: { first_name: "John", last_name: "Doe" },
          leave_type: { name: "年假" },
        },
        {
          id: 2,
          user: { first_name: "Jane", last_name: "Smith" },
          leave_type: { name: "病假" },
        },
      ],
      totalMembers: 10,
    };

    mockGetTeamMembersOnLeaveToday.mockResolvedValue(mockData);

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("8")).toBeInTheDocument(); // Present members
      expect(screen.getByText("共 10 人")).toBeInTheDocument();
      expect(screen.getByText("80.0%")).toBeInTheDocument(); // Attendance rate
      expect(screen.getByText("今日請假 (2 人)")).toBeInTheDocument();
    });
  });

  it("displays individual leave members correctly", async () => {
    const mockData = {
      onLeaveMembers: [
        {
          id: 1,
          user: { first_name: "John", last_name: "Doe" },
          leave_type: { name: "年假" },
        },
        {
          id: 2,
          user: { first_name: "Jane", last_name: "Smith" },
          leave_type: { name: "病假" },
        },
      ],
      totalMembers: 10,
    };

    mockGetTeamMembersOnLeaveToday.mockResolvedValue(mockData);

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("DoeJohn - 年假")).toBeInTheDocument();
      expect(screen.getByText("SmithJane - 病假")).toBeInTheDocument();
    });
  });

  it("displays message when no one is on leave", async () => {
    const mockData = {
      onLeaveMembers: [],
      totalMembers: 10,
    };

    mockGetTeamMembersOnLeaveToday.mockResolvedValue(mockData);

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument(); // All present
      expect(screen.getByText("100.0%")).toBeInTheDocument(); // 100% attendance
      expect(screen.getByText("今日請假 (0 人)")).toBeInTheDocument();
      expect(screen.getByText("今日無團隊成員請假")).toBeInTheDocument();
    });
  });

  it("handles error state correctly", async () => {
    mockGetTeamMembersOnLeaveToday.mockRejectedValue(new Error("API Error"));

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("無法載入團隊資料")).toBeInTheDocument();
    });
  });

  it("calculates attendance rate correctly with zero members", async () => {
    const mockData = {
      onLeaveMembers: [],
      totalMembers: 0,
    };

    mockGetTeamMembersOnLeaveToday.mockResolvedValue(mockData);

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument(); // Present members
      expect(screen.getByText("共 0 人")).toBeInTheDocument();
      expect(screen.getByText("0.0%")).toBeInTheDocument(); // Should handle division by zero
    });
  });

  it("displays correct structure and labels", async () => {
    const mockData = {
      onLeaveMembers: [],
      totalMembers: 5,
    };

    mockGetTeamMembersOnLeaveToday.mockResolvedValue(mockData);

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("今日出勤")).toBeInTheDocument();
      expect(screen.getByText("出勤率")).toBeInTheDocument();
      expect(screen.getByText("今日請假 (0 人)")).toBeInTheDocument();
    });
  });

  it("handles partial team on leave correctly", async () => {
    const mockData = {
      onLeaveMembers: [
        {
          id: 1,
          user: { first_name: "John", last_name: "Doe" },
          leave_type: { name: "年假" },
        },
      ],
      totalMembers: 3,
    };

    mockGetTeamMembersOnLeaveToday.mockResolvedValue(mockData);

    render(<TeamAvailability />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // 3 - 1 = 2 present
      expect(screen.getByText("共 3 人")).toBeInTheDocument();
      expect(screen.getByText("66.7%")).toBeInTheDocument(); // 2/3 * 100 = 66.7%
      expect(screen.getByText("今日請假 (1 人)")).toBeInTheDocument();
    });
  });
}); 