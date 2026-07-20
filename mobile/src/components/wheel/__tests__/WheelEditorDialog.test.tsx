import { fireEvent, render, screen } from '@testing-library/react-native';

import { WheelEditorDialog } from '@/components/wheel/WheelEditorDialog';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useCreateWheel, useUpdateWheel } from '@/hooks/useWheelMutations';
import type { Restaurant } from '@/types/restaurant';
import type { UserWheel } from '@/types/wheel';

const mockCopyShareLink = jest.fn();

jest.mock('@/hooks/useRestaurants', () => ({ useRestaurants: jest.fn() }));
jest.mock('@/hooks/useWheelMutations', () => ({
  useCreateWheel: jest.fn(),
  useUpdateWheel: jest.fn(),
}));
jest.mock('@/hooks/useShareWheelLink', () => ({
  useShareWheelLink: () => ({ copyShareLink: mockCopyShareLink }),
}));

const mockUseRestaurants = useRestaurants as jest.MockedFunction<typeof useRestaurants>;
const mockCreate = useCreateWheel as jest.MockedFunction<typeof useCreateWheel>;
const mockUpdate = useUpdateWheel as jest.MockedFunction<typeof useUpdateWheel>;

const createMutate = jest.fn();
const updateMutate = jest.fn();

function restaurant(id: string, name: string): Restaurant {
  return {
    id,
    concurrencyToken: 't',
    name,
    city: 'Tallinn',
    latitude: 59.4,
    longitude: 24.7,
    offerTimeText: '',
    parkingInfo: '',
    openingInfo: '',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
  };
}

function wheel(overrides: Partial<UserWheel> = {}): UserWheel {
  return {
    id: 'w1',
    concurrencyToken: 'tok-w1',
    name: 'Lunch',
    restaurantNames: [],
    isPublic: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRestaurants.mockReturnValue({
    data: [restaurant('r1', 'Sushi Place'), restaurant('r2', 'Pizza Barn'), restaurant('r3', 'Taco Hub')],
  } as ReturnType<typeof useRestaurants>);
  mockCreate.mockReturnValue({ mutate: createMutate, isPending: false } as unknown as ReturnType<
    typeof useCreateWheel
  >);
  mockUpdate.mockReturnValue({ mutate: updateMutate, isPending: false } as unknown as ReturnType<
    typeof useUpdateWheel
  >);
});

describe('WheelEditorDialog', () => {
  it('filters the checkbox list by the search input', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} />);
    expect(screen.getByText('Sushi Place')).toBeTruthy();
    expect(screen.getByText('Pizza Barn')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Search restaurants'), 'taco');

    expect(screen.getByText('Taco Hub')).toBeTruthy();
    expect(screen.queryByText('Sushi Place')).toBeNull();
    expect(screen.queryByText('Pizza Barn')).toBeNull();
  });

  it('creates a wheel from the name, checked restaurant names, and public switch', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Friday lunch'), 'Friday');
    fireEvent.press(screen.getByText('Sushi Place'));
    fireEvent.press(screen.getByText('Taco Hub'));
    fireEvent.press(screen.getByLabelText('Public'));

    fireEvent.press(screen.getByText('Save'));

    expect(createMutate).toHaveBeenCalledWith(
      { name: 'Friday', restaurantNames: ['Sushi Place', 'Taco Hub'], isPublic: true },
      expect.any(Object),
    );
  });

  it('updates an existing wheel with its concurrency token', () => {
    render(
      <WheelEditorDialog
        open
        onClose={jest.fn()}
        wheel={wheel({ name: 'Lunch', restaurantNames: ['Pizza Barn'] })}
      />,
    );
    fireEvent.press(screen.getByText('Save'));

    expect(updateMutate).toHaveBeenCalledWith(
      {
        id: 'w1',
        input: { name: 'Lunch', restaurantNames: ['Pizza Barn'], isPublic: false },
        concurrencyToken: 'tok-w1',
      },
      expect.any(Object),
    );
  });

  it('shows the copy-share action only for a saved public wheel', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} wheel={wheel({ isPublic: true })} />);
    fireEvent.press(screen.getByText('Copy share link'));
    expect(mockCopyShareLink).toHaveBeenCalledWith('w1');
  });

  it('hides the copy-share action for an unsaved wheel even when public is on', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Public'));
    expect(screen.queryByText('Copy share link')).toBeNull();
  });
});
