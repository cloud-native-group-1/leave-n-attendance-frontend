import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EmployeeCard, TeamMember } from "../employee-card";
import { useRouter } from "next/navigation";

// Mock the UI components
jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img data-testid="avatar-image" src={src} alt={alt} />
  ),
  AvatarFallback: ({ children }: any) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div data-testid="card-footer" className={className}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({ children }: any) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

jest.mock("@/lib/utils", () => ({
  formatDate: (date: string) => `formatted-${date}`,
}));

jest.mock("lucide-react", () => ({
  Mail: () => <div data-testid="mail-icon" />,
}));

const mockPush = jest.fn();
jest.mocked(useRouter).mockReturnValue({
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
});

describe("EmployeeCard Component", () => {
  const mockMember: TeamMember = {
    id: 1,
    employee_id: "EMP001",
    first_name: "John",
    last_name: "Doe",
    position: "Software Engineer",
    email: "john.doe@company.com",
    department: "Engineering",
    status: "在職中",
    isCurrentUser: false,
    isManager: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders employee information correctly", () => {
    render(<EmployeeCard member={mockMember} />);
    
    expect(screen.getByText("DoeJohn")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("john.doe@company.com")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("displays correct status badge for active employee", () => {
    render(<EmployeeCard member={mockMember} />);
    
    const statusBadge = screen.getByText("在職中");
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveAttribute("data-variant", "default");
  });

  it("displays correct status badge for employee on leave", () => {
    const memberOnLeave: TeamMember = {
      ...mockMember,
      status: "請假中",
      leaveType: "年假",
      leaveUntil: "2024-01-15",
    };

    render(<EmployeeCard member={memberOnLeave} />);
    
    const statusBadge = screen.getByText("請假中");
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveAttribute("data-variant", "outline");
  });

  it("shows current user badge when isCurrentUser is true", () => {
    const currentUser: TeamMember = {
      ...mockMember,
      isCurrentUser: true,
    };

    render(<EmployeeCard member={currentUser} />);
    
    expect(screen.getByText("本人")).toBeInTheDocument();
  });

  it("shows manager badge when isManager is true", () => {
    const manager: TeamMember = {
      ...mockMember,
      isManager: true,
    };

    render(<EmployeeCard member={manager} />);
    
    expect(screen.getByText("主管")).toBeInTheDocument();
  });

  it("handles department being undefined", () => {
    const memberWithoutDept: TeamMember = {
      ...mockMember,
      department: undefined,
    };

    render(<EmployeeCard member={memberWithoutDept} />);
    
    expect(screen.queryByText("Engineering")).not.toBeInTheDocument();
  });

  it("navigates to profile page when button is clicked", () => {
    render(<EmployeeCard member={mockMember} />);
    
    const profileButton = screen.getByText("查看個人資料");
    fireEvent.click(profileButton);
    
    expect(mockPush).toHaveBeenCalledWith("/dashboard/profile/1");
  });

  it("displays leave information in tooltip for employee on leave", () => {
    const memberOnLeave: TeamMember = {
      ...mockMember,
      status: "請假中",
      leaveType: "年假",
      leaveUntil: "2024-01-15",
    };

    render(<EmployeeCard member={memberOnLeave} />);
    
    expect(screen.getByText("年假")).toBeInTheDocument();
    expect(screen.getByText("直到 formatted-2024-01-15")).toBeInTheDocument();
  });

  it("has correct card structure and styling", () => {
    render(<EmployeeCard member={mockMember} />);
    
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("max-w-[20rem]", "flex", "flex-col", "overflow-hidden", "justify-between", "h-[360px]");
  });

  it("displays mail icon", () => {
    render(<EmployeeCard member={mockMember} />);
    
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
  });

  it("shows green status bar for active employee", () => {
    render(<EmployeeCard member={mockMember} />);
    
    const statusBar = screen.getByTestId("card-content").querySelector(".bg-green-500");
    expect(statusBar).toBeInTheDocument();
  });

  it("shows amber status bar for employee on leave", () => {
    const memberOnLeave: TeamMember = {
      ...mockMember,
      status: "請假中",
    };

    render(<EmployeeCard member={memberOnLeave} />);
    
    const statusBar = screen.getByTestId("card-content").querySelector(".bg-amber-500");
    expect(statusBar).toBeInTheDocument();
  });
}); 