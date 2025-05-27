import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UpcomingHolidays } from "../upcoming-holidays";
import { getUpcomingHolidays } from "@/lib/services/holiday";

// Mock the UI components
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

// Mock lucide-react
jest.mock("lucide-react", () => ({
  CalendarIcon: () => <div data-testid="calendar-icon" />,
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date, formatStr) => "2024年01月15日"),
  differenceInDays: jest.fn((date1, date2) => 5),
}));

// Mock holiday service
jest.mock("@/lib/services/holiday", () => ({
  getUpcomingHolidays: jest.fn(),
}));

const mockGetUpcomingHolidays = getUpcomingHolidays as jest.MockedFunction<typeof getUpcomingHolidays>;

describe("UpcomingHolidays Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton initially", () => {
    mockGetUpcomingHolidays.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<UpcomingHolidays />);
    
    expect(screen.getAllByTestId("skeleton")).toHaveLength(12); // Based on actual skeleton structure
  });

  it("displays holidays correctly", async () => {
    const mockHolidays = [
      {
        id: 1,
        name: "元旦",
        date: "2024-01-01",
        description: "新年第一天",
      },
      {
        id: 2,
        name: "春節",
        date: "2024-02-10",
        description: "農曆新年",
      },
    ];

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      expect(screen.getByText("元旦")).toBeInTheDocument();
      expect(screen.getByText("春節")).toBeInTheDocument();
      expect(screen.getByText("2024年01月15日 - 新年第一天")).toBeInTheDocument();
      expect(screen.getByText("2024年01月15日 - 農曆新年")).toBeInTheDocument();
    });
  });

  it("displays holiday without description correctly", async () => {
    const mockHolidays = [
      {
        id: 1,
        name: "國慶日",
        date: "2024-10-10",
      },
    ];

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      expect(screen.getByText("國慶日")).toBeInTheDocument();
      expect(screen.getByText("2024年01月15日")).toBeInTheDocument();
      expect(screen.queryByText("2024年01月15日 -")).not.toBeInTheDocument();
    });
  });

  it("displays correct day badges", async () => {
    const { differenceInDays } = require("date-fns");
    
    // Test different day scenarios
    const mockHolidays = [
      { id: 1, name: "今天假日", date: "2024-01-01" },
      { id: 2, name: "明天假日", date: "2024-01-02" },
      { id: 3, name: "五天後假日", date: "2024-01-06" },
    ];

    // Mock different return values for differenceInDays
    differenceInDays
      .mockReturnValueOnce(0) // Today
      .mockReturnValueOnce(1) // Tomorrow
      .mockReturnValueOnce(5); // 5 days later

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      expect(screen.getByText("今天")).toBeInTheDocument();
      expect(screen.getByText("明天")).toBeInTheDocument();
      expect(screen.getByText("5天後")).toBeInTheDocument();
    });
  });

  it("displays no holidays message when list is empty", async () => {
    mockGetUpcomingHolidays.mockResolvedValue([]);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      expect(screen.getByText("近期沒有公休假日")).toBeInTheDocument();
    });
  });

  it("handles error state correctly", async () => {
    mockGetUpcomingHolidays.mockRejectedValue(new Error("API Error"));

    render(<UpcomingHolidays />);

    await waitFor(() => {
      expect(screen.getByText("無法載入假日資料")).toBeInTheDocument();
    });
  });

  it("renders calendar icons for each holiday", async () => {
    const mockHolidays = [
      { id: 1, name: "假日1", date: "2024-01-01" },
      { id: 2, name: "假日2", date: "2024-01-02" },
    ];

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      const calendarIcons = screen.getAllByTestId("calendar-icon");
      expect(calendarIcons).toHaveLength(2);
    });
  });

  it("renders badges with correct variant", async () => {
    const mockHolidays = [
      { id: 1, name: "假日", date: "2024-01-01" },
    ];

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });
  });

  it("has correct structure and styling", async () => {
    const mockHolidays = [
      { id: 1, name: "假日", date: "2024-01-01", description: "描述" },
    ];

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      // Check that the main container has correct spacing
      const container = screen.getByText("假日").closest(".space-y-4");
      expect(container).toBeInTheDocument();
      
      // Check that holiday items have correct structure
      const holidayItem = screen.getByText("假日").closest(".flex");
      expect(holidayItem).toHaveClass("flex", "items-start", "gap-3");
    });
  });

  it("formats dates correctly", async () => {
    const { format } = require("date-fns");
    
    const mockHolidays = [
      { id: 1, name: "假日", date: "2024-01-01" },
    ];

    mockGetUpcomingHolidays.mockResolvedValue(mockHolidays);

    render(<UpcomingHolidays />);

    await waitFor(() => {
      expect(format).toHaveBeenCalledWith(expect.any(Date), 'yyyy年MM月dd日');
    });
  });
}); 