import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Navbar } from "../navbar";
import { useRouter } from "next/navigation";

// Mock the UI components
jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img data-testid="avatar-image" src={src} alt={alt} />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button data-testid="button" onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-menu-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-menu-label">{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-menu-trigger">{children}</div>,
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: ({ className }: any) => <div data-testid="sidebar-trigger" className={className} />,
}));

jest.mock("lucide-react", () => ({
  LogOut: () => <div data-testid="logout-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  User: () => <div data-testid="user-icon" />,
}));

jest.mock("../notifications-popover", () => ({
  NotificationsPopover: () => <div data-testid="notifications-popover" />,
}));

// Mock the auth hook
const mockUseAuth = jest.fn();
jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockPush = jest.fn();
const mockLogout = jest.fn();

jest.mocked(useRouter).mockReturnValue({
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
});

describe("Navbar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders navbar with basic structure", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("notifications-popover")).toBeInTheDocument();
    expect(screen.getByTestId("button")).toBeInTheDocument(); // User menu button
  });

  it("displays user information when user is loaded", () => {
    const mockUser = {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    expect(screen.getByText("DoeJohn")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("John");
  });

  it("displays loading state when user is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      loading: true,
    });

    render(<Navbar />);
    
    expect(screen.getByText("載入中...")).toBeInTheDocument();
  });

  it("displays not logged in state when no user", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    expect(screen.getByText("未登入")).toBeInTheDocument();
  });

  it("navigates to profile when profile menu item is clicked", () => {
    const mockUser = {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    const profileMenuItem = screen.getByText("個人資料").closest('[data-testid="dropdown-menu-item"]');
    fireEvent.click(profileMenuItem!);
    
    expect(mockPush).toHaveBeenCalledWith("/dashboard/profile/1");
  });

  it("navigates to settings when settings menu item is clicked", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    const settingsMenuItem = screen.getByText("設定").closest('[data-testid="dropdown-menu-item"]');
    fireEvent.click(settingsMenuItem!);
    
    expect(mockPush).toHaveBeenCalledWith("/dashboard/settings");
  });

  it("logs out and navigates to login when logout menu item is clicked", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    const logoutMenuItem = screen.getByText("登出").closest('[data-testid="dropdown-menu-item"]');
    fireEvent.click(logoutMenuItem!);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("renders all menu items with correct icons", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    expect(screen.getByTestId("user-icon")).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
  });

  it("does not navigate to profile when no user is present", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    const profileMenuItem = screen.getByText("個人資料").closest('[data-testid="dropdown-menu-item"]');
    fireEvent.click(profileMenuItem!);
    
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("has correct navbar structure and styling", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
      logout: mockLogout,
      loading: false,
    });

    render(<Navbar />);
    
    const navbar = screen.getByTestId("navbar");
    expect(navbar).toHaveClass("border-b", "bg-background", "mb-4");
  });
}); 