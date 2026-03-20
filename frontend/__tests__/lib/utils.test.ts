import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// cn (classNames utility: clsx + tailwind-merge)
// ---------------------------------------------------------------------------
describe('cn', () => {
  it('should return a single class name unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('should merge multiple class names into a single string', () => {
    const result = cn('flex', 'items-center', 'gap-4');
    expect(result).toBe('flex items-center gap-4');
  });

  it('should resolve Tailwind conflicts, keeping the last one', () => {
    // tailwind-merge resolves p-2 vs p-4 → keeps p-4 (the latter)
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('should filter out falsy values (undefined, false, null)', () => {
    const result = cn('text-sm', undefined, false, null, 'font-bold');
    expect(result).toBe('text-sm font-bold');
  });

  it('should handle an empty call gracefully', () => {
    expect(cn()).toBe('');
  });
});
