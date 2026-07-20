import { fireEvent, render, screen } from '@testing-library/react-native';

// app/ is at the project root, outside the "@/" (src) alias — use a relative path.
import WheelScreen from '../../../../app/(tabs)/wheel';
import { useWheels } from '@/hooks/useWheels';
import { useDeleteWheel } from '@/hooks/useWheelMutations';
import type { UserWheel } from '@/types/wheel';

const mockCopyShareLink = jest.fn();
const deleteMutate = jest.fn();

jest.mock('@/hooks/useWheels', () => ({ useWheels: jest.fn() }));
jest.mock('@/hooks/useWheelMutations', () => ({ useDeleteWheel: jest.fn() }));
jest.mock('@/hooks/useShareWheelLink', () => ({
  useShareWheelLink: () => ({ copyShareLink: mockCopyShareLink }),
}));
// Editor and spinner have their own tests; stub them.
jest.mock('@/components/wheel/WheelEditorDialog', () => ({
  WheelEditorDialog: ({ wheel }: { wheel: unknown }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>editor-{wheel ? 'edit' : 'new'}</Text>;
  },
}));
jest.mock('@/components/wheel/WheelSpinner', () => ({
  WheelSpinner: ({ names }: { names: string[] }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>spinner-{names.join(',')}</Text>;
  },
}));

const mockUseWheels = useWheels as jest.MockedFunction<typeof useWheels>;
const mockUseDelete = useDeleteWheel as jest.MockedFunction<typeof useDeleteWheel>;

function wheel(id: string, name: string, isPublic = false): UserWheel {
  return { id, concurrencyToken: `tok-${id}`, name, restaurantNames: ['A', 'B'], isPublic };
}

function setWheels(list: UserWheel[]) {
  mockUseWheels.mockReturnValue({
    data: list,
    isLoading: false,
    isError: false,
    error: null,
  } as ReturnType<typeof useWheels>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDelete.mockReturnValue({ mutate: deleteMutate } as unknown as ReturnType<
    typeof useDeleteWheel
  >);
  setWheels([wheel('w1', 'Lunch', true), wheel('w2', 'Dinner', false)]);
});

describe('WheelScreen', () => {
  it('lists saved wheels with spin/edit/delete actions', () => {
    render(<WheelScreen />);
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Dinner')).toBeTruthy();
    expect(screen.getAllByText('Spin').length).toBe(2);
    expect(screen.getAllByText('Edit').length).toBe(2);
    expect(screen.getAllByText('Delete').length).toBe(2);
  });

  it('opens the editor in new mode from "New wheel"', () => {
    render(<WheelScreen />);
    fireEvent.press(screen.getByText('New wheel'));
    expect(screen.getByText('editor-new')).toBeTruthy();
  });

  it('shows the spinner for the selected wheel', () => {
    render(<WheelScreen />);
    // The first wheel's Spin button.
    fireEvent.press(screen.getAllByText('Spin')[0]);
    expect(screen.getByText('spinner-A,B')).toBeTruthy();
  });

  it('shows a Share action only on public wheels', () => {
    render(<WheelScreen />);
    // Only the public wheel (Lunch) has a Share action.
    const shares = screen.getAllByText('Share');
    expect(shares.length).toBe(1);
    fireEvent.press(shares[0]);
    expect(mockCopyShareLink).toHaveBeenCalledWith('w1');
  });

  it('deletes a wheel with its concurrency token', () => {
    render(<WheelScreen />);
    fireEvent.press(screen.getByLabelText('Delete Lunch'));
    expect(deleteMutate).toHaveBeenCalledWith({ id: 'w1', concurrencyToken: 'tok-w1' });
  });
});
