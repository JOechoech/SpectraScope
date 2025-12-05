/**
 * Section - Settings Section Wrapper
 *
 * Simple wrapper that renders a section title with bottom border,
 * then children with consistent spacing.
 */

import { memo } from 'react';

export interface SectionProps {
  /** Section title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Section content */
  children: React.ReactNode;
}

export const Section = memo(function Section({
  title,
  subtitle,
  children,
}: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800/50 pb-2">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        {subtitle && (
          <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
});

export default Section;
