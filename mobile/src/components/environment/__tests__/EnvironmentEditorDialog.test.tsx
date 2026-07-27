import { fireEvent, render, screen } from '@testing-library/react-native';

import { EnvironmentEditorDialog } from '@/components/environment/EnvironmentEditorDialog';
import {
  useAutoFillEnvironment,
  useCreateEnvironment,
  useDeleteEnvironment,
  useUpdateEnvironment,
} from '@/hooks/useEnvironmentMutations';
import type { DiningEnvironment } from '@/types/environment';

jest.mock('@/hooks/useEnvironmentMutations', () => ({
  useCreateEnvironment: jest.fn(),
  useUpdateEnvironment: jest.fn(),
  useDeleteEnvironment: jest.fn(),
  useAutoFillEnvironment: jest.fn(),
}));

// Toasts need a provider at runtime; stub the hook so we can assert pushes.
const mockPush = jest.fn();
jest.mock('@/components/design-system/feedback/ToastProvider', () => ({
  useToast: () => ({ push: mockPush }),
}));

// react-native-maps has no Jest renderer; the picker is exercised in its own
// test. Stub the module to a couple of buttons that drive the origin, and keep
// the real `validateOrigin` so the dialog's validation path is genuine.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = React.forwardRef((_props: any, _ref: any) => <View />);
  return { __esModule: true, default: Stub, Marker: Stub, Circle: Stub };
});
jest.mock('@/components/environment/EnvironmentLocationPicker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  const actual = jest.requireActual('@/components/environment/EnvironmentLocationPicker');
  return {
    validateOrigin: actual.validateOrigin,
    EnvironmentLocationPicker: ({ onChange }: any) => (
      <>
        <Pressable
          accessibilityLabel="pick-partial"
          onPress={() => onChange({ latitude: 1, longitude: null, radiusMeters: null })}
        >
          <Text>partial</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="pick-valid"
          onPress={() => onChange({ latitude: 1, longitude: 2, radiusMeters: null })}
        >
          <Text>valid</Text>
        </Pressable>
      </>
    ),
  };
});

const mockCreate = useCreateEnvironment as jest.MockedFunction<typeof useCreateEnvironment>;
const mockUpdate = useUpdateEnvironment as jest.MockedFunction<typeof useUpdateEnvironment>;
const mockDelete = useDeleteEnvironment as jest.MockedFunction<typeof useDeleteEnvironment>;
const mockAutoFill = useAutoFillEnvironment as jest.MockedFunction<typeof useAutoFillEnvironment>;

function mutation() {
  return { mutate: jest.fn(), isPending: false };
}

let create: ReturnType<typeof mutation>;
let update: ReturnType<typeof mutation>;
let remove: ReturnType<typeof mutation>;
let autoFill: ReturnType<typeof mutation>;

const NO_ORIGIN = {
  autoFillLatitude: null,
  autoFillLongitude: null,
  autoFillRadiusMeters: null,
};

function environment(overrides: Partial<DiningEnvironment> = {}): DiningEnvironment {
  return {
    id: 'e1',
    concurrencyToken: 'tok-1',
    name: 'Lunch',
    description: null,
    ...NO_ORIGIN,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  create = mutation();
  update = mutation();
  remove = mutation();
  autoFill = mutation();
  mockCreate.mockReturnValue(create as unknown as ReturnType<typeof useCreateEnvironment>);
  mockUpdate.mockReturnValue(update as unknown as ReturnType<typeof useUpdateEnvironment>);
  mockDelete.mockReturnValue(remove as unknown as ReturnType<typeof useDeleteEnvironment>);
  mockAutoFill.mockReturnValue(autoFill as unknown as ReturnType<typeof useAutoFillEnvironment>);
});

describe('EnvironmentEditorDialog', () => {
  it('creates an environment from a submitted name', () => {
    render(<EnvironmentEditorDialog open onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch spots'), 'New env');
    fireEvent.press(screen.getByText('Save'));
    expect(create.mutate).toHaveBeenCalledWith(
      { name: 'New env', description: null, ...NO_ORIGIN },
      expect.any(Object),
    );
  });

  it('renames an environment sending its concurrency token', () => {
    render(<EnvironmentEditorDialog open onClose={jest.fn()} environment={environment()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch spots'), 'Renamed');
    fireEvent.press(screen.getByText('Save'));
    expect(update.mutate).toHaveBeenCalledWith(
      {
        id: 'e1',
        input: { name: 'Renamed', description: null, ...NO_ORIGIN },
        concurrencyToken: 'tok-1',
      },
      expect.any(Object),
    );
  });

  it('requires an in-dialog confirmation step before deleting', () => {
    render(<EnvironmentEditorDialog open onClose={jest.fn()} environment={environment()} />);
    // First press only reveals the confirmation step, it does not delete.
    fireEvent.press(screen.getByLabelText('Delete environment'));
    expect(remove.mutate).not.toHaveBeenCalled();
    expect(screen.getByText('Delete environment')).toBeTruthy();

    // Confirming actually deletes with the concurrency token.
    fireEvent.press(screen.getByText('Delete'));
    expect(remove.mutate).toHaveBeenCalledWith(
      { id: 'e1', concurrencyToken: 'tok-1' },
      expect.any(Object),
    );
  });

  it('does not enable Save for an empty name', () => {
    const onClose = jest.fn();
    render(<EnvironmentEditorDialog open onClose={onClose} />);
    fireEvent.press(screen.getByText('Save'));
    expect(create.mutate).not.toHaveBeenCalled();
  });

  it('shows the fill button only when the environment has stored coordinates', () => {
    const { rerender } = render(
      <EnvironmentEditorDialog open onClose={jest.fn()} environment={environment()} />,
    );
    expect(screen.queryByText('Fill with nearby restaurants')).toBeNull();

    rerender(
      <EnvironmentEditorDialog
        open
        onClose={jest.fn()}
        environment={environment({ autoFillLatitude: 59.4, autoFillLongitude: 24.7 })}
      />,
    );
    expect(screen.getByText('Fill with nearby restaurants')).toBeTruthy();
  });

  it('runs auto-fill and toasts the number added', () => {
    autoFill.mutate = jest.fn((_id, opts) =>
      opts.onSuccess({ added: 3, alreadyPresent: 1, totalMembers: 4 }),
    );
    mockAutoFill.mockReturnValue(autoFill as unknown as ReturnType<typeof useAutoFillEnvironment>);

    render(
      <EnvironmentEditorDialog
        open
        onClose={jest.fn()}
        environment={environment({ autoFillLatitude: 59.4, autoFillLongitude: 24.7 })}
      />,
    );
    fireEvent.press(screen.getByText('Fill with nearby restaurants'));
    expect(autoFill.mutate).toHaveBeenCalledWith('e1', expect.any(Object));
    expect(mockPush).toHaveBeenCalledWith({ title: 'Added 3 restaurants', tone: 'success' });
  });

  it('blocks a save with a partial location and shows an inline error', () => {
    render(<EnvironmentEditorDialog open onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch spots'), 'New env');
    fireEvent.press(screen.getByLabelText('pick-partial'));
    fireEvent.press(screen.getByText('Save'));
    expect(create.mutate).not.toHaveBeenCalled();
    expect(screen.getByText('Set both coordinates or clear the location.')).toBeTruthy();
  });
});
