/**
 * US Stock Market Hours (Eastern Time)
 *
 * Pre-Market:  4:00 AM - 9:30 AM ET
 * Regular:     9:30 AM - 4:00 PM ET
 * After Hours: 4:00 PM - 8:00 PM ET
 * Closed:      8:00 PM - 4:00 AM ET (and weekends)
 */

export type MarketSession = 'pre-market' | 'open' | 'after-hours' | 'closed';

export interface MarketStatus {
  session: MarketSession;
  label: string;
  color: string;
  nextEvent: {
    label: string;
    time: Date;
    countdown: string;
  } | null;
}

export function getMarketStatus(): MarketStatus {
  // Get current time in Eastern Time
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const day = etTime.getDay(); // 0 = Sunday, 6 = Saturday
  const timeInMinutes = hours * 60 + minutes;

  // Weekend check
  if (day === 0 || day === 6) {
    const nextOpen = getNextMarketOpen(etTime);
    return {
      session: 'closed',
      label: 'Market Closed',
      color: 'text-slate-400',
      nextEvent: {
        label: 'Opens',
        time: nextOpen,
        countdown: formatCountdown(now, nextOpen),
      },
    };
  }

  // Time boundaries in minutes from midnight
  const preMarketStart = 4 * 60; // 4:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  const afterHoursEnd = 20 * 60; // 8:00 PM

  // Pre-Market: 4:00 AM - 9:30 AM
  if (timeInMinutes >= preMarketStart && timeInMinutes < marketOpen) {
    const openTime = new Date(etTime);
    openTime.setHours(9, 30, 0, 0);

    return {
      session: 'pre-market',
      label: 'Pre-Market',
      color: 'text-blue-400',
      nextEvent: {
        label: 'Opens',
        time: openTime,
        countdown: formatCountdown(now, openTime),
      },
    };
  }

  // Market Open: 9:30 AM - 4:00 PM
  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    const closeTime = new Date(etTime);
    closeTime.setHours(16, 0, 0, 0);

    return {
      session: 'open',
      label: 'Market Open',
      color: 'text-emerald-400',
      nextEvent: {
        label: 'Closes',
        time: closeTime,
        countdown: formatCountdown(now, closeTime),
      },
    };
  }

  // After Hours: 4:00 PM - 8:00 PM
  if (timeInMinutes >= marketClose && timeInMinutes < afterHoursEnd) {
    const nextOpen = getNextMarketOpen(etTime);

    return {
      session: 'after-hours',
      label: 'After Hours',
      color: 'text-amber-400',
      nextEvent: {
        label: 'Opens',
        time: nextOpen,
        countdown: formatCountdown(now, nextOpen),
      },
    };
  }

  // Closed: 8:00 PM - 4:00 AM
  const nextOpen = getNextMarketOpen(etTime);
  return {
    session: 'closed',
    label: 'Market Closed',
    color: 'text-slate-400',
    nextEvent: {
      label: 'Opens',
      time: nextOpen,
      countdown: formatCountdown(now, nextOpen),
    },
  };
}

function getNextMarketOpen(now: Date): Date {
  const next = new Date(now);

  // If it's before 9:30 AM on a weekday, market opens today
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();

  if (day >= 1 && day <= 5 && (hours < 9 || (hours === 9 && minutes < 30))) {
    next.setHours(9, 30, 0, 0);
    return next;
  }

  // Otherwise, find next weekday
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(9, 30, 0, 0);

  return next;
}

function formatCountdown(from: Date, to: Date): string {
  const diffMs = to.getTime() - from.getTime();

  if (diffMs <= 0) return 'now';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    return `${days}d ${hours}h`;
  }

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }

  return `${diffMinutes}m`;
}

export default {
  getMarketStatus,
};
