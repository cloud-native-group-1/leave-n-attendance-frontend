import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AppSidebar } from "../app-sidebar";

// Mock the UI components
jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: any) => <div data-testid="sidebar-content">{children}</div>,
  SidebarGroup: ({ children }: any) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div data-testid="sidebar-group-content">{children}</div>,
  SidebarGroupLabel: ({ children }: any) => <div data-testid="sidebar-group-label">{children}</div>,
  SidebarMenu: ({ children }: any) => <div data-testid="sidebar-menu">{children}</div>,
  SidebarMenuButton: ({ children, asChild }: any) => 
    asChild ? children : <div data-testid="sidebar-menu-button">{children}</div>,
  SidebarMenuItem: ({ children }: any) => <div data-testid="sidebar-menu-item">{children}</div>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Bell: () => <div data-testid="bell-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  ClipboardCheck: () => <div data-testid="clipboard-check-icon" />,
  ClipboardList: () => <div data-testid="clipboard-list-icon" />,
  Home: () => <div data-testid="home-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
}));

// Mock the auth hook
const mockUseAuth = jest.fn();
jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("AppSidebar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders skeleton when loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(<AppSidebar />);
    
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    // Should show skeleton loading state
    const skeletonElements = screen.getAllByText((content, element) => {
      return element?.classList.contains('animate-pulse') || false;
    });
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders skeleton when user is null", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<AppSidebar />);
    
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders all menu items for manager", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_manager: true },
      loading: false,
    });

    render(<AppSidebar />);
    
    expect(screen.getByText("請假與考勤系統")).toBeInTheDocument();
    expect(screen.getByText("儀表板")).toBeInTheDocument();
    expect(screen.getByText("請假申請")).toBeInTheDocument();
    expect(screen.getByText("審核申請")).toBeInTheDocument();
    expect(screen.getByText("行事曆")).toBeInTheDocument();
    expect(screen.getByText("團隊")).toBeInTheDocument();
    expect(screen.getByText("通知")).toBeInTheDocument();
  });

  it("hides approval menu item for non-manager", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_manager: false },
      loading: false,
    });

    render(<AppSidebar />);
    
    expect(screen.getByText("儀表板")).toBeInTheDocument();
    expect(screen.getByText("請假申請")).toBeInTheDocument();
    expect(screen.queryByText("審核申請")).not.toBeInTheDocument();
    expect(screen.getByText("行事曆")).toBeInTheDocument();
    expect(screen.getByText("團隊")).toBeInTheDocument();
    expect(screen.getByText("通知")).toBeInTheDocument();
  });

  it("renders correct links for menu items", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_manager: true },
      loading: false,
    });

    render(<AppSidebar />);
    
    expect(screen.getByRole("link", { name: /儀表板/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /請假申請/ })).toHaveAttribute("href", "/dashboard/leave-requests");
    expect(screen.getByRole("link", { name: /審核申請/ })).toHaveAttribute("href", "/dashboard/approvals");
    expect(screen.getByRole("link", { name: /行事曆/ })).toHaveAttribute("href", "/dashboard/calendar");
    expect(screen.getByRole("link", { name: /團隊/ })).toHaveAttribute("href", "/dashboard/team");
    expect(screen.getByRole("link", { name: /通知/ })).toHaveAttribute("href", "/dashboard/notifications");
  });

  it("renders correct icons for menu items", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_manager: true },
      loading: false,
    });

    render(<AppSidebar />);
    
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    expect(screen.getByTestId("clipboard-list-icon")).toBeInTheDocument();
    expect(screen.getByTestId("clipboard-check-icon")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
    expect(screen.getByTestId("users-icon")).toBeInTheDocument();
    expect(screen.getByTestId("bell-icon")).toBeInTheDocument();
  });

  it("has correct sidebar structure", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, is_manager: false },
      loading: false,
    });

    render(<AppSidebar />);
    
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-label")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-content")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-menu")).toBeInTheDocument();
  });
}); 