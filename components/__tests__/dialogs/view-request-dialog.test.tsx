import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ViewRequestDialog } from "../../dialogs/view-request-dialog";
import { isTeamLeaveRequest } from "@/lib/services/leave-request";

// Mock the UI components
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogDescription: ({ children }: any) => (
    <div data-testid="dialog-description">{children}</div>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

// Mock the leave request service
jest.mock("@/lib/services/leave-request", () => ({
  isTeamLeaveRequest: jest.fn(),
}));

const mockIsTeamLeaveRequest = isTeamLeaveRequest as jest.MockedFunction<typeof isTeamLeaveRequest>;

describe("ViewRequestDialog Component", () => {
  const mockRequest = {
    id: 1,
    request_id: "REQ001",
    leave_type: { name: "年假" },
    start_date: "2024-01-15",
    end_date: "2024-01-17",
    days_count: 3,
    reason: "Personal vacation",
    status: "pending" as const,
    proxy_person: { first_name: "Jane", last_name: "Smith" },
    created_at: "2024-01-01T10:00:00Z",
    approver: null,
    rejection_reason: null,
    approved_at: null,
  };

  const mockApprovedRequest = {
    ...mockRequest,
    status: "approved" as const,
    approver: { first_name: "Manager", last_name: "Boss" },
    approved_at: "2024-01-02T15:30:00Z",
  };

  const mockRejectedRequest = {
    ...mockRequest,
    status: "rejected" as const,
    rejection_reason: "Insufficient notice",
  };

  const mockTeamRequest = {
    ...mockRequest,
    user: {
      first_name: "John",
      last_name: "Doe",
    },
  };

  const mockProps = {
    isOpen: true,
    onOpenChange: jest.fn(),
    request: mockRequest as any,
    formatName: jest.fn((user: any) => `${user?.first_name} ${user?.last_name}`),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProps.formatName.mockImplementation((user: any) => 
      user ? `${user.first_name} ${user.last_name}` : ""
    );
  });

  it("renders nothing when request is null", () => {
    render(
      <ViewRequestDialog
        {...mockProps}
        request={null}
      />
    );
    
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing when dialog is closed", () => {
    render(
      <ViewRequestDialog
        {...mockProps}
        isOpen={false}
      />
    );
    
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog content when open and request exists", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("請假申請詳情")).toBeInTheDocument();
    expect(screen.getByText("請假申請的詳細資訊。")).toBeInTheDocument();
  });

  it("displays basic request information correctly", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.getByText("REQ001")).toBeInTheDocument();
    expect(screen.getByText("年假")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15 至 2024-01-17")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Personal vacation")).toBeInTheDocument();
  });

  it("displays employee information for team requests", () => {
    mockIsTeamLeaveRequest.mockReturnValue(true);
    
    render(
      <ViewRequestDialog
        {...mockProps}
        request={mockTeamRequest as any}
      />
    );
    
    expect(screen.getByText("員工:")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(mockProps.formatName).toHaveBeenCalledWith(mockTeamRequest.user);
  });

  it("does not display employee information for personal requests", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.queryByText("員工:")).not.toBeInTheDocument();
  });

  it("displays proxy person information", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.getByText("代理人:")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(mockProps.formatName).toHaveBeenCalledWith(mockRequest.proxy_person);
  });

  it("displays correct status badge for pending request", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("審核中");
    expect(badge).toHaveAttribute("data-variant", "outline");
  });

  it("displays correct status badge for approved request", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(
      <ViewRequestDialog
        {...mockProps}
        request={mockApprovedRequest as any}
      />
    );
    
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("已核准");
    expect(badge).toHaveAttribute("data-variant", "default");
  });

  it("displays correct status badge for rejected request", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(
      <ViewRequestDialog
        {...mockProps}
        request={mockRejectedRequest as any}
      />
    );
    
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("已拒絕");
    expect(badge).toHaveAttribute("data-variant", "destructive");
  });

  it("displays approver information when available", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(
      <ViewRequestDialog
        {...mockProps}
        request={mockApprovedRequest as any}
      />
    );
    
    expect(screen.getByText("審核人:")).toBeInTheDocument();
    expect(screen.getByText("Manager Boss")).toBeInTheDocument();
  });

  it("displays rejection reason when available", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(
      <ViewRequestDialog
        {...mockProps}
        request={mockRejectedRequest as any}
      />
    );
    
    expect(screen.getByText("拒絕原因:")).toBeInTheDocument();
    expect(screen.getByText("Insufficient notice")).toBeInTheDocument();
  });

  it("displays approved time when available", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(
      <ViewRequestDialog
        {...mockProps}
        request={mockApprovedRequest as any}
      />
    );
    
    expect(screen.getByText("核准時間:")).toBeInTheDocument();
    // Check for the specific approved time format
    expect(screen.getByText("1/2/2024, 11:30:00 PM")).toBeInTheDocument();
  });

  it("displays creation time correctly", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.getByText("建立時間:")).toBeInTheDocument();
    // Check for the specific creation time format
    expect(screen.getByText("1/1/2024, 6:00:00 PM")).toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    const closeButton = screen.getByText("關閉");
    fireEvent.click(closeButton);
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("displays all required field labels", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.getByText("申請編號:")).toBeInTheDocument();
    expect(screen.getByText("假別:")).toBeInTheDocument();
    expect(screen.getByText("期間:")).toBeInTheDocument();
    expect(screen.getByText("請假天數:")).toBeInTheDocument();
    expect(screen.getByText("請假原因:")).toBeInTheDocument();
    expect(screen.getByText("狀態:")).toBeInTheDocument();
    expect(screen.getByText("代理人:")).toBeInTheDocument();
    expect(screen.getByText("建立時間:")).toBeInTheDocument();
  });

  it("has correct dialog structure", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<ViewRequestDialog {...mockProps} />);
    
    expect(screen.getByTestId("dialog-header")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-footer")).toBeInTheDocument();
  });
}); 