import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Loading from "../loading";

describe("Loading Component", () => {
  it("renders loading spinner and text", () => {
    render(<Loading />);
    
    // Check if loading text is present
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    // Check if the component has the correct structure
    const container = screen.getByText("Loading...").closest("div");
    expect(container).toHaveClass("flex", "flex-col", "items-center", "justify-center", "h-full", "py-24");
  });

  it("has correct styling classes", () => {
    render(<Loading />);
    
    const loadingText = screen.getByText("Loading...");
    expect(loadingText).toHaveClass("mt-2", "text-sm", "text-muted-foreground");
  });
}); 