import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DepartmentLeaveChart } from "../department-leave-chart";

// Mock recharts components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill, name }: any) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} data-name={name} />
  ),
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("DepartmentLeaveChart Component", () => {
  it("renders chart container with correct structure", () => {
    render(<DepartmentLeaveChart />);
    
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders all chart components", () => {
    render(<DepartmentLeaveChart />);
    
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("renders all bar types with correct properties", () => {
    render(<DepartmentLeaveChart />);
    
    const bars = screen.getAllByTestId("bar");
    expect(bars).toHaveLength(4);
    
    // Check annual leave bar
    const annualBar = bars.find(bar => bar.getAttribute("data-key") === "annual");
    expect(annualBar).toHaveAttribute("data-fill", "#8884d8");
    expect(annualBar).toHaveAttribute("data-name", "年假");
    
    // Check sick leave bar
    const sickBar = bars.find(bar => bar.getAttribute("data-key") === "sick");
    expect(sickBar).toHaveAttribute("data-fill", "#82ca9d");
    expect(sickBar).toHaveAttribute("data-name", "病假");
    
    // Check personal leave bar
    const personalBar = bars.find(bar => bar.getAttribute("data-key") === "personal");
    expect(personalBar).toHaveAttribute("data-fill", "#ffc658");
    expect(personalBar).toHaveAttribute("data-name", "事假");
    
    // Check public holiday bar
    const publicBar = bars.find(bar => bar.getAttribute("data-key") === "public");
    expect(publicBar).toHaveAttribute("data-fill", "#ff8042");
    expect(publicBar).toHaveAttribute("data-name", "國定假日");
  });

  it("has correct container styling", () => {
    render(<DepartmentLeaveChart />);
    
    const container = screen.getByTestId("responsive-container").parentElement;
    expect(container).toHaveClass("h-[300px]", "w-full");
  });

  it("passes correct data to chart", () => {
    render(<DepartmentLeaveChart />);
    
    const barChart = screen.getByTestId("bar-chart");
    const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
    
    expect(chartData).toHaveLength(5);
    expect(chartData[0]).toEqual({
      name: "工程部",
      annual: 15,
      sick: 8,
      personal: 6,
      public: 2,
    });
  });

  it("configures X-axis with correct dataKey", () => {
    render(<DepartmentLeaveChart />);
    
    const xAxis = screen.getByTestId("x-axis");
    expect(xAxis).toHaveAttribute("data-key", "name");
  });
}); 