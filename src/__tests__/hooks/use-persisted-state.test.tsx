import { act, render } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { usePersistedState } from '@/hooks/use-persisted-state';

type Api = ReturnType<typeof usePersistedState<string>>;

interface ProbeProps {
  persistKey: string | undefined;
  read: (persistKey: string) => string | undefined;
  write: (persistKey: string, value: string) => void;
  renders?: string[];
  api?: { current?: Api };
}

const Probe = ({ persistKey, read, write, renders, api }: ProbeProps) => {
  const state = usePersistedState({ persistKey, defaultValue: 'default', read, write });
  const text = `${state.value}|${state.isRestored}`;
  renders?.push(text);
  if (api) {
    api.current = state;
  }
  return <span>{text}</span>;
};

describe('usePersistedState', () => {
  it('restores on the first client render', () => {
    const renders: string[] = [];
    render(<Probe persistKey="k" read={() => 'saved'} write={vi.fn()} renders={renders} />);
    expect(renders[0]).toBe('saved|true');
  });

  it('renders the default on the server', () => {
    const read = vi.fn(() => 'saved');
    const write = vi.fn();
    const html = renderToString(<Probe persistKey="k" read={read} write={write} />);
    expect(html).toContain('default|false');
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('hydrates with the default, then restores, without a mismatch', async () => {
    const write = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(
      <Probe persistKey="k" read={() => 'saved'} write={write} />
    );
    expect(container.textContent).toBe('default|false');

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <Probe persistKey="k" read={() => 'saved'} write={write} />, {
        onRecoverableError,
      });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('saved|true');
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('k', 'saved');
    expect(write).not.toHaveBeenCalledWith('k', 'default');
    container.remove();
  });

  it('writes on each change, not on re-renders with the same value', () => {
    const write = vi.fn();
    const api: { current?: Api } = {};
    const read = () => undefined;
    const { rerender } = render(<Probe persistKey="k" read={read} write={write} api={api} />);
    expect(write).toHaveBeenLastCalledWith('k', 'default');
    expect(write).toHaveBeenCalledTimes(1);

    act(() => api.current?.setValue('b'));
    expect(write).toHaveBeenLastCalledWith('k', 'b');
    act(() => api.current?.setValue(prev => `${prev}!`));
    expect(write).toHaveBeenLastCalledWith('k', 'b!');
    expect(write).toHaveBeenCalledTimes(3);

    rerender(<Probe persistKey="k" read={read} write={write} api={api} />);
    act(() => api.current?.setValue('b!'));
    expect(write).toHaveBeenCalledTimes(3);
  });

  it('is restored, and never reads or writes, without a persistKey', () => {
    const read = vi.fn(() => 'saved');
    const write = vi.fn();
    const api: { current?: Api } = {};
    const { container } = render(
      <Probe persistKey={undefined} read={read} write={write} api={api} />
    );
    expect(container.textContent).toBe('default|true');
    act(() => api.current?.setValue('b'));
    expect(container.textContent).toBe('b|true');
    expect(renderToString(<Probe persistKey={undefined} read={read} write={write} />)).toContain(
      'default|true'
    );
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
});
