import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LeaveRequestFilters } from "../../filters/leave-request-filters";

// Mock the UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button data-testid="button" onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect, selected }: any) => (
    <div data-testid="calendar" onClick={() => onSelect?.(new Date("2024-01-15"))}>
      Calendar Component
    </div>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children, open }: any) => open ? <div data-testid="popover">{children}</div> : children,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.("test-value")}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

// Mock lucide-react
jest.mock("lucide-react", () => ({
  CalendarIcon: () => <div data-testid="calendar-icon" />,
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date, formatStr) => "2024-01-15"),
  isValid: jest.fn(() => true),
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
  formatName: jest.fn((person: any) => `${person?.first_name} ${person?.last_name}`),
}));

// Mock team service
jest.mock("@/lib/services/team", () => ({
  getTeamMembers: jest.fn(() => Promise.resolve([
    { id: 1, first_name: "John", last_name: "Doe" },
    { id: 2, first_name: "Jane", last_name: "Smith" },
  ])),
}));

describe("LeaveRequestFilters Component", () => {
  const mockLeaveTypes = [
    { id: 1, name: "年假", color_code: "#blue" },
    { id: 2, name: "病假", color_code: "#red" },
    { id: 3, name: "事假", color_code: "#yellow" },
  ];

  const mockFilters = {
    leave_type_id: undefined,
    status: undefined,
    start_date: undefined,
    end_date: undefined,
    employee_id: undefined,
  };

  const mockProps = {
    type: "my-requests" as const,
    filters: mockFilters,
    leaveTypes: mockLeaveTypes,
    onFilterChange: jest.fn(),
    onResetFilters: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders leave type filter", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    expect(screen.getByText("假別")).toBeInTheDocument();
    const selects = screen.getAllByTestId("select");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("renders status filter for non-pending-approval types", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    expect(screen.getByText("狀態")).toBeInTheDocument();
  });

  it("does not render status filter for pending-approval type", () => {
    render(<LeaveRequestFilters {...mockProps} type="pending-approval" />);
    
    expect(screen.queryByText("狀態")).not.toBeInTheDocument();
  });

  it("renders time period filter", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    expect(screen.getByText("時間期間")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
  });

  it("calls onFilterChange when leave type is changed", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    const leaveTypeSelect = screen.getAllByTestId("select")[0];
    fireEvent.click(leaveTypeSelect);
    
    expect(mockProps.onFilterChange).toHaveBeenCalledWith("leave_type_id", "test-value");
  });

  it("calls onFilterChange when status is changed", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    const statusSelect = screen.getAllByTestId("select")[1];
    fireEvent.click(statusSelect);
    
    expect(mockProps.onFilterChange).toHaveBeenCalledWith("status", "test-value");
  });

  it("displays correct leave type options", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    expect(screen.getByText("年假")).toBeInTheDocument();
    expect(screen.getByText("病假")).toBeInTheDocument();
    expect(screen.getByText("事假")).toBeInTheDocument();
  });

  it("displays correct status options", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    const statusOptions = screen.getAllByText("所有狀態");
    expect(statusOptions.length).toBeGreaterThan(0);
    expect(screen.getByText("審核中")).toBeInTheDocument();
    expect(screen.getByText("已核准")).toBeInTheDocument();
    expect(screen.getByText("已拒絕")).toBeInTheDocument();
  });

  it("shows date range when filters have dates", () => {
    const filtersWithDates = {
      ...mockFilters,
      start_date: "2024-01-15",
      end_date: "2024-01-20",
    };

    render(<LeaveRequestFilters {...mockProps} filters={filtersWithDates} />);
    
    // Should show formatted date range
    expect(screen.getByText("2024-01-15 - 2024-01-15")).toBeInTheDocument();
  });

  it("shows placeholder when no date range selected", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    expect(screen.getByText("選擇時間期間")).toBeInTheDocument();
  });

  it("renders employee filter for team requests", async () => {
    render(<LeaveRequestFilters {...mockProps} type="team-requests" />);
    
    await waitFor(() => {
      expect(screen.getByText("員工")).toBeInTheDocument();
    });
  });

  it("renders employee filter for pending approval", async () => {
    render(<LeaveRequestFilters {...mockProps} type="pending-approval" />);
    
    await waitFor(() => {
      expect(screen.getByText("員工")).toBeInTheDocument();
    });
  });

  it("does not render employee filter for my requests", () => {
    render(<LeaveRequestFilters {...mockProps} type="my-requests" />);
    
    expect(screen.queryByText("員工")).not.toBeInTheDocument();
  });

  it("renders reset and close buttons", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    expect(screen.getByText("重設")).toBeInTheDocument();
    expect(screen.getByText("套用篩選")).toBeInTheDocument();
  });

  it("calls onResetFilters when reset button is clicked", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    const resetButton = screen.getByText("重設");
    fireEvent.click(resetButton);
    
    expect(mockProps.onResetFilters).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    render(<LeaveRequestFilters {...mockProps} />);
    
    const closeButton = screen.getByText("套用篩選");
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
}); 