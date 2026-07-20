import { fireEvent, render, screen } from '@testing-library/react-native';

import { EnvironmentEditorDialog } from '@/components/environment/EnvironmentEditorDialog';
import {
  useCreateEnvironment,
  useDeleteEnvironment,
  useUpdateEnvironment,
} from '@/hooks/useEnvironmentMutations';
import type { DiningEnvironment } from '@/types/environment';

jest.mock('@/hooks/useEnvironmentMutations', () => ({
  useCreateEnvironment: jest.fn(),
  useUpdateEnvironment: jest.fn(),
  useDeleteEnvironment: jest.fn(),
}));

const mockCreate = useCreateEnvironment as jest.MockedFunction<typeof useCreateEnvironment>;
const mockUpdate = useUpdateEnvironment as jest.MockedFunction<typeof useUpdateEnvironment>;
const mockDelete = useDeleteEnvironment as jest.MockedFunction<typeof useDeleteEnvironment>;

function mutation() {
  return { mutate: jest.fn(), isPending: false };
}

let create: ReturnType<typeof mutation>;
let update: ReturnType<typeof mutation>;
let remove: ReturnType<typeof mutation>;

function environment(): DiningEnvironment {
  return { id: 'e1', concurrencyToken: 'tok-1', name: 'Lunch', description: null };
}

beforeEach(() => {
  jest.clearAllMocks();
  create = mutation();
  update = mutation();
  remove = mutation();
  mockCreate.mockReturnValue(create as unknown as ReturnType<typeof useCreateEnvironment>);
  mockUpdate.mockReturnValue(update as unknown as ReturnType<typeof useUpdateEnvironment>);
  mockDelete.mockReturnValue(remove as unknown as ReturnType<typeof useDeleteEnvironment>);
});

describe('EnvironmentEditorDialog', () => {
  it('creates an environment from a submitted name', () => {
    render(<EnvironmentEditorDialog open onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch spots'), 'New env');
    fireEvent.press(screen.getByText('Save'));
    expect(create.mutate).toHaveBeenCalledWith(
      { name: 'New env', description: null },
      expect.any(Object),
    );
  });

  it('renames an environment sending its concurrency token', () => {
    render(<EnvironmentEditorDialog open onClose={jest.fn()} environment={environment()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch spots'), 'Renamed');
    fireEvent.press(screen.getByText('Save'));
    expect(update.mutate).toHaveBeenCalledWith(
      { id: 'e1', input: { name: 'Renamed', description: null }, concurrencyToken: 'tok-1' },
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
});
