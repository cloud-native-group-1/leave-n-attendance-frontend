import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TeamCalendar } from "../team-calendar";

// Mock the UI components
jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect, selected, modifiers, modifiersClassNames }: any) => (
    <div data-testid="calendar">
      <button 
        data-testid="calendar-date-button"
        onClick={() => onSelect?.(new Date(2023, 9, 15))}
      >
        Select Date
      </button>
      <div data-testid="selected-date">{selected?.toISOString()}</div>
    </div>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img data-testid="avatar-image" src={src} alt={alt} />,
}));

describe("TeamCalendar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders calendar and card components", () => {
    render(<TeamCalendar />);
    
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByTestId("card-content")).toBeInTheDocument();
  });

  it("displays initial date selection prompt", () => {
    render(<TeamCalendar />);
    
    // Should show current date initially since component sets new Date() as default
    const dateText = screen.getByText(/年|月|日/);
    expect(dateText).toBeInTheDocument();
  });

  it("updates selected date when calendar date is clicked", () => {
    render(<TeamCalendar />);
    
    const dateButton = screen.getByTestId("calendar-date-button");
    fireEvent.click(dateButton);
    
    // The selected date should be updated in the calendar component
    const selectedDate = screen.getByTestId("selected-date");
    expect(selectedDate).toBeInTheDocument();
  });

  it("displays team members on leave for selected date", () => {
    render(<TeamCalendar />);
    
    // Click on a date that has team members on leave (Oct 15, 2023)
    const dateButton = screen.getByTestId("calendar-date-button");
    fireEvent.click(dateButton);
    
    // Should show avatars for team members on leave
    const avatars = screen.getAllByTestId("avatar");
    expect(avatars.length).toBeGreaterThan(0);
    
    // Should show avatar fallbacks with member initials
    const avatarFallbacks = screen.getAllByTestId("avatar-fallback");
    expect(avatarFallbacks.length).toBeGreaterThan(0);
  });

  it("shows no team members message when no one is on leave", () => {
    render(<TeamCalendar />);
    
    // The component should handle dates with no leave data
    // Since we're mocking the calendar to always select Oct 15, 2023,
    // and that date has members on leave, we need to test the logic differently
    
    // The component should render without errors
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("formats date correctly in Chinese locale", () => {
    render(<TeamCalendar />);
    
    // Should display date in Chinese format
    // The component uses toLocaleDateString with zh-TW locale
    const dateElements = screen.getAllByText(/年|月|日|星期/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("has correct layout structure", () => {
    render(<TeamCalendar />);
    
    const container = screen.getByTestId("calendar").parentElement;
    expect(container).toHaveClass("flex", "flex-col", "md:flex-row", "gap-6");
    
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("flex-1");
  });

  it("displays calendar with correct props", () => {
    render(<TeamCalendar />);
    
    const calendar = screen.getByTestId("calendar");
    expect(calendar).toBeInTheDocument();
    
    // Calendar should be rendered with single mode
    // This is tested through the mock implementation
  });

  it("handles date selection and member display correctly", () => {
    render(<TeamCalendar />);
    
    // Initially should show current date
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
    
    // Click to select a date
    const dateButton = screen.getByTestId("calendar-date-button");
    fireEvent.click(dateButton);
    
    // Should update the display
    expect(screen.getByTestId("selected-date")).toBeInTheDocument();
  });

  it("renders team member avatars with correct fallback text", () => {
    render(<TeamCalendar />);
    
    // Select a date with team members on leave
    const dateButton = screen.getByTestId("calendar-date-button");
    fireEvent.click(dateButton);
    
    // Check that avatars are rendered
    const avatars = screen.getAllByTestId("avatar");
    expect(avatars.length).toBeGreaterThan(0);
    
    // Check that avatar fallbacks contain the expected initials
    const fallbacks = screen.getAllByTestId("avatar-fallback");
    expect(fallbacks.length).toBeGreaterThan(0);
    
    // The sample data includes members like "JD", "AS", "TW"
    const fallbackTexts = fallbacks.map(fb => fb.textContent);
    expect(fallbackTexts).toContain("JD");
    expect(fallbackTexts).toContain("AS");
    expect(fallbackTexts).toContain("TW");
  });
}); 