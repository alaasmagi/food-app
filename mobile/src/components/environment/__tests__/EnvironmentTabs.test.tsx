import { fireEvent, render, screen } from '@testing-library/react-native';

import { EnvironmentTabs } from '@/components/environment/EnvironmentTabs';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useEnvironmentStore } from '@/stores/environmentStore';
import type { DiningEnvironment } from '@/types/environment';

jest.mock('@/hooks/useEnvironments', () => ({ useEnvironments: jest.fn() }));
// The dialog is exercised in its own test; stub it to isolate the tab row.
jest.mock('@/components/environment/EnvironmentEditorDialog', () => ({
  EnvironmentEditorDialog: ({ open, environment }: { open: boolean; environment: unknown }) => {
    const React = require('react');
    const { Text } = require('react-native');
    if (!open) return null;
    return <Text>editor-open-{environment ? 'edit' : 'create'}</Text>;
  },
}));

const mockUseEnvironments = useEnvironments as jest.MockedFunction<typeof useEnvironments>;

function env(id: string, name: string): DiningEnvironment {
  return { id, concurrencyToken: 't', name, description: null };
}

function setEnvironments(list: DiningEnvironment[]) {
  mockUseEnvironments.mockReturnValue({ data: list } as ReturnType<typeof useEnvironments>);
}

describe('EnvironmentTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEnvironmentStore.setState({ selectedEnvironmentId: null });
    setEnvironments([env('e1', 'Lunch'), env('e2', 'Dinner')]);
  });

  it('renders an All tab plus one per environment', () => {
    render(<EnvironmentTabs />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Dinner')).toBeTruthy();
  });

  it('selecting a tab updates the store; All resets to null', () => {
    render(<EnvironmentTabs />);
    fireEvent.press(screen.getByText('Lunch'));
    expect(useEnvironmentStore.getState().selectedEnvironmentId).toBe('e1');
    fireEvent.press(screen.getByText('All'));
    expect(useEnvironmentStore.getState().selectedEnvironmentId).toBeNull();
  });

  it('opens the editor in create mode from the New affordance', () => {
    render(<EnvironmentTabs />);
    fireEvent.press(screen.getByLabelText('New environment'));
    expect(screen.getByText('editor-open-create')).toBeTruthy();
  });

  it('shows the edit affordance only when a specific environment is selected', () => {
    useEnvironmentStore.setState({ selectedEnvironmentId: 'e1' });
    render(<EnvironmentTabs />);
    fireEvent.press(screen.getByLabelText('Edit environment'));
    expect(screen.getByText('editor-open-edit')).toBeTruthy();
  });

  it('hides the edit affordance on All', () => {
    render(<EnvironmentTabs />);
    expect(screen.queryByLabelText('Edit environment')).toBeNull();
  });
});
