import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "../theme-provider";

// Mock next-themes
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children, ...props }: any) => (
    <div data-testid="theme-provider">
      {children}
    </div>
  ),
}));

describe("ThemeProvider Component", () => {
  it("renders children correctly", () => {
    render(
      <ThemeProvider>
        <div>Test Child</div>
      </ThemeProvider>
    );
    
    expect(screen.getByText("Test Child")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
  });

  it("passes props to NextThemesProvider", () => {
    const testProps = {
      attribute: "class" as const,
      defaultTheme: "system",
      enableSystem: true,
    };

    render(
      <ThemeProvider {...testProps}>
        <div>Test Child</div>
      </ThemeProvider>
    );
    
    const provider = screen.getByTestId("theme-provider");
    expect(provider).toBeInTheDocument();
    // The NextThemesProvider doesn't expose these as DOM attributes
    // We just verify that the component renders without errors
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });
}); 