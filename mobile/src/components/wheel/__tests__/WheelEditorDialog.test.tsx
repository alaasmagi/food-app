import { fireEvent, render, screen } from '@testing-library/react-native';

import { WheelEditorDialog } from '@/components/wheel/WheelEditorDialog';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useEnvironmentRestaurants } from '@/hooks/useEnvironmentRestaurants';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useCreateWheel, useUpdateWheel } from '@/hooks/useWheelMutations';
import type { DiningEnvironment, EnvironmentRestaurant } from '@/types/environment';
import type { Restaurant } from '@/types/restaurant';
import type { UserWheel } from '@/types/wheel';

const mockCopyShareLink = jest.fn();
const mockToastPush = jest.fn();

jest.mock('@/hooks/useRestaurants', () => ({ useRestaurants: jest.fn() }));
jest.mock('@/hooks/useEnvironments', () => ({ useEnvironments: jest.fn() }));
jest.mock('@/hooks/useEnvironmentRestaurants', () => {
  const actual = jest.requireActual('@/hooks/useEnvironmentRestaurants');
  return { ...actual, useEnvironmentRestaurants: jest.fn() };
});
jest.mock('@/hooks/useWheelMutations', () => ({
  useCreateWheel: jest.fn(),
  useUpdateWheel: jest.fn(),
}));
jest.mock('@/hooks/useShareWheelLink', () => ({
  useShareWheelLink: () => ({ copyShareLink: mockCopyShareLink }),
}));
jest.mock('@/components/design-system/feedback/ToastProvider', () => ({
  useToast: () => ({ push: mockToastPush }),
}));

const mockUseRestaurants = useRestaurants as jest.MockedFunction<typeof useRestaurants>;
const mockUseEnvironments = useEnvironments as jest.MockedFunction<typeof useEnvironments>;
const mockUseEnvironmentRestaurants = useEnvironmentRestaurants as jest.MockedFunction<
  typeof useEnvironmentRestaurants
>;
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

function environment(id: string, name: string): DiningEnvironment {
  return {
    id,
    concurrencyToken: 't',
    name,
    description: null,
    autoFillLatitude: null,
    autoFillLongitude: null,
    autoFillRadiusMeters: null,
  };
}

function membership(environmentId: string, restaurantId: string): EnvironmentRestaurant {
  return { id: `m-${environmentId}-${restaurantId}`, concurrencyToken: 't', environmentId, restaurantId };
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
  mockUseEnvironments.mockReturnValue({
    data: [environment('e1', 'Work lunch'), environment('e2', 'Weekend spots')],
  } as ReturnType<typeof useEnvironments>);
  // e1 -> Sushi Place (r1) + Taco Hub (r3) + a deleted restaurant (r9, not in the catalog).
  // e2 -> Pizza Barn (r2) only.
  mockUseEnvironmentRestaurants.mockReturnValue({
    data: [
      membership('e1', 'r1'),
      membership('e1', 'r3'),
      membership('e1', 'r9'),
      membership('e2', 'r2'),
    ],
  } as ReturnType<typeof useEnvironmentRestaurants>);
  mockCreate.mockReturnValue({ mutate: createMutate, isPending: false } as unknown as ReturnType<
    typeof useCreateWheel
  >);
  mockUpdate.mockReturnValue({ mutate: updateMutate, isPending: false } as unknown as ReturnType<
    typeof useUpdateWheel
  >);
});

/** Opens the import Select and picks the given environment by its visible name. */
function importEnvironment(environmentName: string) {
  fireEvent.press(screen.getByLabelText('Import from environment'));
  fireEvent.press(screen.getByText(environmentName));
}

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

  it('lists the user environments in the import control', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Import from environment'));
    expect(screen.getByText('Work lunch')).toBeTruthy();
    expect(screen.getByText('Weekend spots')).toBeTruthy();
  });

  it('merges an environment into the selection additively, skipping unresolved memberships', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} wheel={wheel({ restaurantNames: ['Pizza Barn'] })} />);

    importEnvironment('Work lunch');
    fireEvent.press(screen.getByText('Save'));

    // Pizza Barn kept, Sushi Place + Taco Hub imported, r9 (not in the catalog) skipped.
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ restaurantNames: ['Sushi Place', 'Pizza Barn', 'Taco Hub'] }),
      }),
      expect.any(Object),
    );
    expect(mockToastPush).toHaveBeenCalledWith(expect.objectContaining({ title: 'Added 2 restaurants' }));
  });

  it('does not duplicate a name already selected when importing', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Friday lunch'), 'Lunch');

    fireEvent.press(screen.getByText('Sushi Place')); // manually check one that e1 also contains
    importEnvironment('Work lunch');
    fireEvent.press(screen.getByText('Save'));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantNames: ['Sushi Place', 'Taco Hub'] }),
      expect.any(Object),
    );
    // Only Taco Hub was new; Sushi Place was already selected.
    expect(mockToastPush).toHaveBeenCalledWith(expect.objectContaining({ title: 'Added 1 restaurant' }));
  });

  it('reports when an import adds nothing new', () => {
    render(<WheelEditorDialog open onClose={jest.fn()} wheel={wheel({ restaurantNames: ['Pizza Barn'] })} />);

    importEnvironment('Weekend spots'); // e2 only contains Pizza Barn, already selected

    expect(mockToastPush).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No new restaurants added' }),
    );
  });

  it('shows a hint instead of the import control when the user has no environments', () => {
    mockUseEnvironments.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useEnvironments>);
    render(<WheelEditorDialog open onClose={jest.fn()} />);

    expect(screen.queryByLabelText('Import from environment')).toBeNull();
    expect(screen.getByText('Create an environment to import its restaurants here.')).toBeTruthy();
  });
});
