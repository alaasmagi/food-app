import { fireEvent, render, screen } from '@testing-library/react-native';

import { FavouriteEditorDialog } from '@/components/favourite/FavouriteEditorDialog';
import { useFavourites } from '@/hooks/useFavourites';
import { useUpsertFavourite } from '@/hooks/useUpsertFavourite';
import type { Favourite } from '@/types/favourite';

const mockPush = jest.fn();

jest.mock('@/hooks/useFavourites', () => ({ useFavourites: jest.fn() }));
jest.mock('@/hooks/useUpsertFavourite', () => ({ useUpsertFavourite: jest.fn() }));
jest.mock('@/components/design-system/feedback/ToastProvider', () => ({
  useToast: () => ({ push: mockPush }),
}));

const mockUseFavourites = useFavourites as jest.MockedFunction<typeof useFavourites>;
const mockUseUpsert = useUpsertFavourite as jest.MockedFunction<typeof useUpsertFavourite>;

const mutate = jest.fn();

function favourite(rating: number, note: string | null = null): Favourite {
  return { id: 'f1', concurrencyToken: 'tok', restaurantId: 'r1', rating, note };
}

function setup(existing?: Favourite) {
  mockUseFavourites.mockReturnValue({
    favouriteFor: (id: string) => (id === 'r1' ? existing : undefined),
  } as unknown as ReturnType<typeof useFavourites>);
  mockUseUpsert.mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpsertFavourite>);
}

describe('FavouriteEditorDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('blocks save when there is no valid rating', () => {
    setup(undefined); // seeds rating 0 → invalid
    render(<FavouriteEditorDialog open onClose={jest.fn()} restaurantId="r1" />);
    fireEvent.press(screen.getByText('Save'));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('upserts and toasts success when a valid rating is saved', () => {
    setup(favourite(4, 'nice')); // seeds rating 4 → valid
    mutate.mockImplementation((_vars, opts) => opts.onSuccess?.());
    const onClose = jest.fn();

    render(<FavouriteEditorDialog open onClose={onClose} restaurantId="r1" />);
    fireEvent.press(screen.getByText('Save'));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: 'r1', rating: 4, note: 'nice' },
      expect.any(Object),
    );
    expect(mockPush).toHaveBeenCalledWith({ title: 'Rating saved', tone: 'success' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('picks a new rating from the stars and saves it', () => {
    setup(undefined);
    mutate.mockImplementation((_vars, opts) => opts.onSuccess?.());

    render(<FavouriteEditorDialog open onClose={jest.fn()} restaurantId="r1" />);
    fireEvent.press(screen.getByLabelText('Rate 5'));
    fireEvent.press(screen.getByText('Save'));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: 'r1', rating: 5, note: null },
      expect.any(Object),
    );
  });

  it('toasts a danger message and keeps the dialog open on error', () => {
    setup(favourite(3));
    mutate.mockImplementation((_vars, opts) => opts.onError?.(new Error('boom')));
    const onClose = jest.fn();

    render(<FavouriteEditorDialog open onClose={onClose} restaurantId="r1" />);
    fireEvent.press(screen.getByText('Save'));

    expect(mockPush).toHaveBeenCalledWith({
      title: 'Could not save rating',
      description: 'Please try again.',
      tone: 'danger',
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
