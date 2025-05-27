import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AvatarGroup, User } from "../avatar-group";

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

jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("AvatarGroup Component", () => {
  const mockUsers: User[] = [
    { id: 1, name: "John Doe", image: "john.jpg" },
    { id: 2, first_name: "Jane", last_name: "Smith" },
    { id: 3, name: "Bob Wilson" },
    { id: 4, first_name: "Alice", last_name: "Brown" },
    { id: 5, name: "Charlie Davis" },
  ];

  it("renders users correctly", () => {
    render(<AvatarGroup users={mockUsers.slice(0, 3)} />);
    
    const avatars = screen.getAllByTestId("avatar");
    expect(avatars).toHaveLength(3);
  });

  it("limits displayed users based on max prop", () => {
    render(<AvatarGroup users={mockUsers} max={3} />);
    
    const avatars = screen.getAllByTestId("avatar");
    expect(avatars).toHaveLength(3);
    
    // Should show remaining count
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("shows all users when count is less than max", () => {
    render(<AvatarGroup users={mockUsers.slice(0, 2)} max={4} />);
    
    const avatars = screen.getAllByTestId("avatar");
    expect(avatars).toHaveLength(2);
    
    // Should not show remaining count
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    render(<AvatarGroup users={mockUsers.slice(0, 2)} size="lg" />);
    
    const avatars = screen.getAllByTestId("avatar");
    expect(avatars[0]).toHaveClass("h-10", "w-10", "text-base");
  });

  it("handles click events", () => {
    const mockOnClick = jest.fn();
    const { container } = render(<AvatarGroup users={mockUsers.slice(0, 2)} onClick={mockOnClick} />);
    
    const avatarGroupContainer = container.firstChild as HTMLElement;
    fireEvent.click(avatarGroupContainer);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("generates correct avatar text for different name formats", () => {
    const testUsers: User[] = [
      { id: 1, name: "John Doe" },
      { id: 2, first_name: "Jane", last_name: "Smith" },
      { id: 3, name: "Bob" },
    ];

    render(<AvatarGroup users={testUsers} />);
    
    const fallbacks = screen.getAllByTestId("avatar-fallback");
    expect(fallbacks[0]).toHaveTextContent("JD");
    expect(fallbacks[1]).toHaveTextContent("JS");
    expect(fallbacks[2]).toHaveTextContent("B");
  });

  it("applies custom className", () => {
    const { container } = render(<AvatarGroup users={mockUsers.slice(0, 2)} className="custom-class" />);
    
    const avatarGroupContainer = container.firstChild as HTMLElement;
    expect(avatarGroupContainer).toHaveClass("custom-class");
  });
}); 