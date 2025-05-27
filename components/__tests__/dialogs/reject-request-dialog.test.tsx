import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RejectRequestDialog } from "../../dialogs/reject-request-dialog";
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
  Button: ({ children, onClick, variant }: any) => (
    <button data-testid="button" onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, placeholder, className }: any) => (
    <textarea
      data-testid="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

// Mock the leave request service
jest.mock("@/lib/services/leave-request", () => ({
  isTeamLeaveRequest: jest.fn(),
}));

const mockIsTeamLeaveRequest = isTeamLeaveRequest as jest.MockedFunction<typeof isTeamLeaveRequest>;

describe("RejectRequestDialog Component", () => {
  const mockRequest = {
    id: 1,
    request_id: "REQ001",
    leave_type: { name: "年假" },
    start_date: "2024-01-15",
    end_date: "2024-01-17",
    days_count: 3,
    reason: "Personal vacation",
    status: "pending" as const,
    proxy_person: null,
    created_at: "2024-01-01",
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
    rejectReason: "",
    onRejectReasonChange: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when request is null", () => {
    render(
      <RejectRequestDialog
        {...mockProps}
        request={null}
      />
    );
    
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing when dialog is closed", () => {
    render(
      <RejectRequestDialog
        {...mockProps}
        isOpen={false}
      />
    );
    
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog content when open and request exists", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("拒絕請假申請")).toBeInTheDocument();
    expect(screen.getByText("請提供拒絕這個請假申請的理由。")).toBeInTheDocument();
  });

  it("displays request information correctly", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    expect(screen.getByText("REQ001")).toBeInTheDocument();
    expect(screen.getByText("年假")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15 至 2024-01-17")).toBeInTheDocument();
  });

  it("shows '您' for personal requests", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    expect(screen.getByText("您")).toBeInTheDocument();
  });

  it("shows formatted user name for team requests", () => {
    mockIsTeamLeaveRequest.mockReturnValue(true);
    mockProps.formatName.mockReturnValue("John Doe");
    
    render(
      <RejectRequestDialog
        {...mockProps}
        request={mockTeamRequest as any}
      />
    );
    
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(mockProps.formatName).toHaveBeenCalledWith(mockTeamRequest.user);
  });

  it("renders textarea with correct props", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} rejectReason="Test reason" />);
    
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveValue("Test reason");
    expect(textarea).toHaveAttribute("placeholder", "請提供拒絕此申請的原因");
    expect(textarea).toHaveClass("resize-none");
  });

  it("calls onRejectReasonChange when textarea value changes", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "New reason" } });
    
    expect(mockProps.onRejectReasonChange).toHaveBeenCalledWith("New reason");
  });

  it("calls onOpenChange when cancel button is clicked", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    const cancelButton = screen.getByText("取消");
    fireEvent.click(cancelButton);
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onConfirm when reject button is clicked", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    const rejectButton = screen.getByText("拒絕");
    fireEvent.click(rejectButton);
    
    expect(mockProps.onConfirm).toHaveBeenCalled();
  });

  it("has correct button variants", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    const buttons = screen.getAllByTestId("button");
    const cancelButton = buttons.find(btn => btn.textContent === "取消");
    const rejectButton = buttons.find(btn => btn.textContent === "拒絕");
    
    expect(cancelButton).toHaveAttribute("data-variant", "outline");
    expect(rejectButton).toHaveAttribute("data-variant", "destructive");
  });

  it("displays all required fields", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    expect(screen.getByText("申請編號:")).toBeInTheDocument();
    expect(screen.getByText("員工:")).toBeInTheDocument();
    expect(screen.getByText("假別:")).toBeInTheDocument();
    expect(screen.getByText("期間:")).toBeInTheDocument();
    expect(screen.getByText("拒絕原因:")).toBeInTheDocument();
  });

  it("has correct dialog structure", () => {
    mockIsTeamLeaveRequest.mockReturnValue(false);
    
    render(<RejectRequestDialog {...mockProps} />);
    
    expect(screen.getByTestId("dialog-header")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-footer")).toBeInTheDocument();
  });
}); 