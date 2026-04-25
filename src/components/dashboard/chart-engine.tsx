// Chart Engine with Lazy Loading, Responsiveness, and Real-Time Updates
// Production-grade chart components for Merchant Dashboard

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// LAZY LOADED RECHARTS
// ============================================

const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));
const PieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })));

const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })));
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
const Area = lazy(() => import('recharts').then(m => ({ default: m.Area })));
const Pie = lazy(() => import('recharts').then(m => ({ default: m.Pie })));
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const Legend = lazy(() => import('recharts').then(m => ({ default: m.Legend })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));

// ============================================
// CHART DATA TYPES
// ============================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  color: string;
}

// ============================================
// CHART LOADING SKELETON
// ============================================

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 300 }: ChartSkeletonProps) {
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LINE CHART COMPONENT
// ============================================

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  realTime?: boolean;
  onRealTimeUpdate?: (data: ChartDataPoint[]) => void;
  className?: string;
}

export function DashboardLineChart({
  data,
  height = 300,
  color = '#3b82f6',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  realTime = false,
  onRealTimeUpdate,
  className,
}: LineChartProps) {
  const [chartData, setChartData] = useState(data);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!realTime) return;

    const interval = setInterval(() => {
      // Simulate real-time data update
      const updatedData = chartData.map((point, index) => ({
        ...point,
        value: point.value + (Math.random() - 0.5) * 10,
      }));

      setChartData(updatedData);
      onRealTimeUpdate?.(updatedData);
    }, 2000);

    return () => clearInterval(interval);
  }, [realTime, chartData, onRealTimeUpdate]);

  // Update chart data when prop changes
  useEffect(() => {
    setChartData(data);
  }, [data]);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
        <ChartSkeleton height={height} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
      <Suspense fallback={<ChartSkeleton height={height} />}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
}

// ============================================
// BAR CHART COMPONENT
// ============================================

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  className?: string;
}

export function DashboardBarChart({
  data,
  height = 300,
  color = '#3b82f6',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  horizontal = false,
  className,
}: BarChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
        <ChartSkeleton height={height} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
      <Suspense fallback={<ChartSkeleton height={height} />}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={horizontal ? 'horizontal' : 'vertical'}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis dataKey={horizontal ? 'value' : 'name'} className="text-xs" />
            <YAxis dataKey={horizontal ? 'name' : 'value'} className="text-xs" />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar dataKey={horizontal ? 'name' : 'value'} fill={color} animationDuration={500} />
          </BarChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
}

// ============================================
// AREA CHART COMPONENT
// ============================================

interface AreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function DashboardAreaChart({
  data,
  height = 300,
  color = '#3b82f6',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  className,
}: AreaChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
        <ChartSkeleton height={height} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
      <Suspense fallback={<ChartSkeleton height={height} />}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
}

// ============================================
// PIE CHART COMPONENT
// ============================================

interface PieChartProps {
  data: ChartDataPoint[];
  height?: number;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function DashboardPieChart({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
  showTooltip = true,
  showLegend = true,
  className,
}: PieChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
        <ChartSkeleton height={height} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('w-full', className)} style={{ height }}>
      <Suspense fallback={<ChartSkeleton height={height} />}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
              animationDuration={500}
            >
              {data.map((entry, index) => (
                <Pie key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
}

// ============================================
// REAL-TIME CHART HOOK
// ============================================

export function useRealTimeChart(initialData: ChartDataPoint[], updateInterval: number = 2000) {
  const [data, setData] = useState(initialData);
  const [isRealTime, setIsRealTime] = useState(false);

  const startRealTime = useCallback(() => {
    setIsRealTime(true);
  }, []);

  const stopRealTime = useCallback(() => {
    setIsRealTime(false);
  }, []);

  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((point) => ({
          ...point,
          value: point.value + (Math.random() - 0.5) * 10,
        }))
      );
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isRealTime, updateInterval]);

  return {
    data,
    isRealTime,
    startRealTime,
    stopRealTime,
  };
}

// ============================================
// CHART CARD COMPONENT
// ============================================

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, actions, className }: ChartCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
