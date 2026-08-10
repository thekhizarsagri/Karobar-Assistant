import { useMemo } from "react";

export function useAvailableYears(analytics, selectedYear) {
  return useMemo(() => {
    const years = new Set(Object.keys(analytics.yearly).map((y) => Number(y)));
    Object.keys(analytics.monthly).forEach((m) => {
      const y = Number(m.split("-")[0]);
      if (!Number.isNaN(y)) years.add(y);
    });
    years.add(new Date().getFullYear());
    years.add(selectedYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [analytics.yearly, analytics.monthly, selectedYear]);
}

export function useYearTotalSales(analytics, selectedYear) {
  return useMemo(() => {
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${selectedYear}-${String(m).padStart(2, "0")}`;
      total += Object.values(analytics.monthly[monthKey] || {}).reduce((a, b) => a + b, 0);
    }
    return total;
  }, [analytics.monthly, selectedYear]);
}

export function useSortedYears(analytics, availableYears) {
  return useMemo(() => {
    return availableYears
      .map((year) => {
        const data = analytics.yearly[String(year)] || {};
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        return { year, total, data };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.year - a.year);
  }, [availableYears, analytics.yearly]);
}

export function useOverallTotal(sortedYears) {
  return useMemo(() => sortedYears.reduce((acc, item) => acc + item.total, 0), [sortedYears]);
}