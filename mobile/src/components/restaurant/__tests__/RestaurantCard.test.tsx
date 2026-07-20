import { fireEvent, render, screen } from '@testing-library/react-native';

import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { useRestaurantOffers } from '@/hooks/useRestaurantOffers';
import {
  useAddRestaurantToEnvironment,
  useRemoveRestaurantFromEnvironment,
} from '@/hooks/useEnvironmentMutations';
import type { Restaurant } from '@/types/restaurant';

jest.mock('@/hooks/useRestaurantOffers', () => ({
  useRestaurantOffers: jest.fn(),
}));
jest.mock('@/hooks/useEnvironmentMutations', () => ({
  useAddRestaurantToEnvironment: jest.fn(),
  useRemoveRestaurantFromEnvironment: jest.fn(),
}));
// OfferList is exercised in its own test; stub it here to isolate the card.
jest.mock('@/components/restaurant/OfferList', () => ({
  OfferList: () => null,
}));
// The editor has its own test and needs query/toast providers; stub it so the
// card test can assert only that opening it renders the editor.
jest.mock('@/components/favourite/FavouriteEditorDialog', () => ({
  FavouriteEditorDialog: ({ restaurantId }: { restaurantId: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>editor-open-{restaurantId}</Text>;
  },
}));

const mockHook = useRestaurantOffers as jest.MockedFunction<typeof useRestaurantOffers>;
const mockAdd = useAddRestaurantToEnvironment as jest.MockedFunction<
  typeof useAddRestaurantToEnvironment
>;
const mockRemove = useRemoveRestaurantFromEnvironment as jest.MockedFunction<
  typeof useRemoveRestaurantFromEnvironment
>;

const addMutate = jest.fn();
const removeMutate = jest.fn();

function restaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'r1',
    concurrencyToken: 'tok',
    name: 'Sushi Place',
    city: 'Tallinn',
    latitude: 59.4,
    longitude: 24.7,
    offerTimeText: '11-15',
    parkingInfo: '',
    openingInfo: '',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
    ...overrides,
  };
}

function mockOffers(partial: Partial<ReturnType<typeof useRestaurantOffers>> = {}) {
  mockHook.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...partial,
  } as ReturnType<typeof useRestaurantOffers>);
}

describe('RestaurantCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockReturnValue({ mutate: addMutate, isPending: false } as unknown as ReturnType<
      typeof useAddRestaurantToEnvironment
    >);
    mockRemove.mockReturnValue({
      mutate: removeMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useRemoveRestaurantFromEnvironment>);
  });

  it('shows the city tag and name', () => {
    mockOffers();
    render(<RestaurantCard restaurant={restaurant()} expanded={false} onToggle={jest.fn()} />);
    expect(screen.getByText('Sushi Place')).toBeTruthy();
    expect(screen.getByText('Tallinn')).toBeTruthy();
  });

  it('shows the fast-food badge when isFastFood', () => {
    mockOffers();
    render(
      <RestaurantCard restaurant={restaurant({ isFastFood: true })} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText('Fast food')).toBeTruthy();
  });

  it('shows the no-offers badge when hasOffers is false', () => {
    mockOffers();
    render(
      <RestaurantCard restaurant={restaurant({ hasOffers: false })} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText('No offers today')).toBeTruthy();
  });

  it('shows the no-offers badge when an expanded query resolves empty', () => {
    mockOffers({ data: [] });
    render(<RestaurantCard restaurant={restaurant()} expanded onToggle={jest.fn()} />);
    expect(screen.getByText('No offers today')).toBeTruthy();
  });

  it('calls onToggle when the header is pressed', () => {
    mockOffers();
    const onToggle = jest.fn();
    render(<RestaurantCard restaurant={restaurant()} expanded={false} onToggle={onToggle} />);
    fireEvent.press(screen.getByLabelText('Sushi Place'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('hides the membership action on "All" (no environment selected)', () => {
    mockOffers();
    render(<RestaurantCard restaurant={restaurant()} expanded={false} onToggle={jest.fn()} />);
    expect(screen.queryByLabelText('Add to environment')).toBeNull();
    expect(screen.queryByLabelText('Remove from environment')).toBeNull();
  });

  it('adds to the selected environment when not a member', () => {
    mockOffers();
    render(
      <RestaurantCard
        restaurant={restaurant()}
        expanded={false}
        onToggle={jest.fn()}
        selectedEnvironmentId="e1"
      />,
    );
    fireEvent.press(screen.getByLabelText('Add to environment'));
    expect(addMutate).toHaveBeenCalledWith({ environmentId: 'e1', restaurantId: 'r1' });
    expect(removeMutate).not.toHaveBeenCalled();
  });

  it('removes via the join row when already a member', () => {
    mockOffers();
    render(
      <RestaurantCard
        restaurant={restaurant()}
        expanded={false}
        onToggle={jest.fn()}
        selectedEnvironmentId="e1"
        membershipEntry={{ joinId: 'm1', concurrencyToken: 'tok-m1' }}
      />,
    );
    fireEvent.press(screen.getByLabelText('Remove from environment'));
    expect(removeMutate).toHaveBeenCalledWith({ joinId: 'm1', concurrencyToken: 'tok-m1' });
    expect(addMutate).not.toHaveBeenCalled();
  });

  it('shows a "Rate" action and no stars when not favourited', () => {
    mockOffers();
    render(<RestaurantCard restaurant={restaurant()} expanded={false} onToggle={jest.fn()} />);
    expect(screen.getByText('Rate')).toBeTruthy();
    expect(screen.queryByText('Edit rating')).toBeNull();
  });

  it('shows read-only stars and an "Edit rating" action when favourited', () => {
    mockOffers();
    render(
      <RestaurantCard
        restaurant={restaurant()}
        expanded={false}
        onToggle={jest.fn()}
        favourite={{ id: 'f1', concurrencyToken: 't', restaurantId: 'r1', rating: 4, note: null }}
      />,
    );
    expect(screen.getByText('Edit rating')).toBeTruthy();
    expect(screen.queryByText('Rate')).toBeNull();
  });

  it('opens the favourite editor when the action is pressed', () => {
    mockOffers();
    render(<RestaurantCard restaurant={restaurant()} expanded={false} onToggle={jest.fn()} />);
    expect(screen.queryByText('editor-open-r1')).toBeNull();
    fireEvent.press(screen.getByText('Rate'));
    expect(screen.getByText('editor-open-r1')).toBeTruthy();
  });
});
