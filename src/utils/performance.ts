// Performance monitoring utilities

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private marks: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.marks.set(name, performance.now());
  }

  endTimer(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      console.warn(`No start time found for timer: ${name}`);
      return 0;
    }

    const duration = performance.now() - start;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    });

    this.marks.delete(name);
    return duration;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  logMetrics(): void {
    console.table(this.metrics);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastExec = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExec >= delay) {
      lastExec = now;
      func(...args);
    }
  };
};

// Memoization utility
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};