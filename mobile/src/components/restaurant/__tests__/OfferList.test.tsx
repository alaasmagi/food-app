import { render, screen } from '@testing-library/react-native';

import { OfferList } from '@/components/restaurant/OfferList';
import { useRestaurantOffers } from '@/hooks/useRestaurantOffers';

jest.mock('@/hooks/useRestaurantOffers', () => ({
  useRestaurantOffers: jest.fn(),
}));

const mockHook = useRestaurantOffers as jest.MockedFunction<typeof useRestaurantOffers>;

function mockResult(partial: Partial<ReturnType<typeof useRestaurantOffers>>) {
  mockHook.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...partial,
  } as ReturnType<typeof useRestaurantOffers>);
}

describe('OfferList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders offer rows with text and price', () => {
    mockResult({
      data: [
        { offerText: 'Chicken soup', offerPrice: '4.90 EUR' },
        { offerText: 'Veggie bowl', offerPrice: null },
      ],
    });
    render(<OfferList restaurantId="r1" />);
    expect(screen.getByText('Chicken soup')).toBeTruthy();
    expect(screen.getByText('4.90 EUR')).toBeTruthy();
    expect(screen.getByText('Veggie bowl')).toBeTruthy();
  });

  it('shows the loading state', () => {
    mockResult({ isLoading: true });
    const { toJSON } = render(<OfferList restaurantId="r1" />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows the empty state', () => {
    mockResult({ data: [] });
    render(<OfferList restaurantId="r1" />);
    expect(screen.getByText('No offers today.')).toBeTruthy();
  });

  it('shows the error state', () => {
    mockResult({ isError: true, error: new Error('boom') });
    render(<OfferList restaurantId="r1" />);
    expect(screen.getByText('boom')).toBeTruthy();
  });
});
