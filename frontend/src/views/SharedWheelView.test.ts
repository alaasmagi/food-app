import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SharedWheelView from './SharedWheelView.vue'
import { getPublicWheel } from '../api/publicWheels'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'w1' } }),
}))

vi.mock('../api/publicWheels', () => ({
  getPublicWheel: vi.fn(),
}))

const getPublicWheelMock = vi.mocked(getPublicWheel)

describe('SharedWheelView', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.clearAllMocks())

  it('renders the wheel name and spinner for a found wheel', async () => {
    getPublicWheelMock.mockResolvedValue({
      id: 'w1',
      name: 'Lunch picks',
      restaurantNames: ['Alpha', 'Beta', 'Gamma'],
    })

    const wrapper = mount(SharedWheelView)
    await flushPromises()

    expect(getPublicWheelMock).toHaveBeenCalledWith('w1')
    expect(wrapper.text()).toContain('Lunch picks')
    // WheelSpinner renders one <path> per name.
    expect(wrapper.findAll('path')).toHaveLength(3)
  })

  it('shows the not-found message when the wheel is missing', async () => {
    getPublicWheelMock.mockResolvedValue(null)

    const wrapper = mount(SharedWheelView)
    await flushPromises()

    expect(wrapper.text()).toContain("This wheel isn't available")
    expect(wrapper.findAll('path')).toHaveLength(0)
  })
})
