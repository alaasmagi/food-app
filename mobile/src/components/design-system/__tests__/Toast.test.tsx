import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast, ToastTone } from '@/components/design-system/feedback/Toast';
import { ToastProvider, useToast } from '@/components/design-system/feedback/ToastProvider';

// Synchronous safe-area metrics so useSafeAreaInsets resolves in tests.
const METRICS = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
}

const TONES: ToastTone[] = ['info', 'success', 'warning', 'danger'];

describe('Toast', () => {
  it.each(TONES)('renders tone "%s" with title and description', (tone) => {
    render(<Toast tone={tone} title="Saved" description="All good" />);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('renders without a description', () => {
    render(<Toast tone="warning" title="Heads up" />);
    expect(screen.getByText('Heads up')).toBeTruthy();
  });

  it('calls onClose when dismissed', () => {
    const onClose = jest.fn();
    render(<Toast title="Bye" onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function Pusher() {
  const { push } = useToast();
  return (
    <Pressable
      accessibilityLabel="push"
      onPress={() => push({ title: 'Rating saved', tone: 'success' })}
    >
      <Text>push</Text>
    </Pressable>
  );
}

describe('ToastProvider / useToast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('renders a pushed toast in the host and auto-dismisses it', () => {
    renderWithProviders(
      <ToastProvider>
        <Pusher />
      </ToastProvider>,
    );

    expect(screen.queryByText('Rating saved')).toBeNull();
    fireEvent.press(screen.getByLabelText('push'));
    expect(screen.getByText('Rating saved')).toBeTruthy();

    // Auto-dismiss after the timeout.
    act(() => jest.advanceTimersByTime(4000));
    expect(screen.queryByText('Rating saved')).toBeNull();
  });

  it('dismisses a toast when its close affordance is pressed', () => {
    renderWithProviders(
      <ToastProvider>
        <Pusher />
      </ToastProvider>,
    );
    fireEvent.press(screen.getByLabelText('push'));
    expect(screen.getByText('Rating saved')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Rating saved')).toBeNull();
  });

  it('throws when used outside a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Pusher />)).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });
});
