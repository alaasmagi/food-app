import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MapMarker from './MapMarker.vue'
import MapDot from './MapDot.vue'
import MapHint from './MapHint.vue'
import MapLegend from './MapLegend.vue'

describe('MapMarker', () => {
  it.each([
    [true, false],
    [true, true],
    [false, false],
    [false, true],
  ])('renders offers=%s selected=%s', (offers, selected) => {
    const wrapper = mount(MapMarker, { props: { name: 'Restaurant', offers, selected } })
    const root = wrapper.find('.ds-map-marker')
    expect(root.classes()).toContain(offers ? 'ds-map-marker--offers' : 'ds-map-marker--plain')
    expect(root.classes('ds-map-marker--selected')).toBe(selected)
    expect(wrapper.find('.ds-map-marker__pill').text()).toContain('Restaurant')
    expect(wrapper.find('svg').exists()).toBe(offers)
  })

  it('adds the screen-reader offers suffix only for offers', () => {
    expect(mount(MapMarker, { props: { name: 'A' } }).text()).toContain(', lunch offers today')
    expect(mount(MapMarker, { props: { name: 'A', offers: false } }).text()).not.toContain('lunch offers')
    expect(mount(MapMarker, { props: { name: 'A', offersLabel: '' } }).find('.visually-hidden').exists()).toBe(false)
  })

  it('is placed when both coordinates are given', () => {
    const root = mount(MapMarker, { props: { name: 'A', x: 0, y: '12px' } }).find('.ds-map-marker')
    expect(root.classes()).toContain('ds-map-marker--placed')
    expect(root.attributes('style')).toContain('left: 0%')
    expect(root.attributes('style')).toContain('top: 12px')
    expect(mount(MapMarker, { props: { name: 'A' } }).find('.ds-map-marker--placed').exists()).toBe(false)
  })

  it('renders a span without a click handler and a button with one', async () => {
    expect(mount(MapMarker, { props: { name: 'A' } }).find('button').exists()).toBe(false)

    const onClick = vi.fn()
    const wrapper = mount(MapMarker, { props: { name: 'A', selected: true, onClick } })
    const button = wrapper.find('button.ds-map-marker')
    expect(button.attributes('aria-expanded')).toBe('true')
    await button.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('MapDot', () => {
  it.each(['user', 'location', 'place'] as const)('renders kind "%s"', (kind) => {
    const dot = mount(MapDot, { props: { kind, x: 10, y: 20 } }).find('.ds-map-dot')
    expect(dot.classes()).toContain(`ds-map-dot--${kind}`)
    expect(dot.attributes('aria-hidden')).toBe('true')
  })

  it('is an image with an accessible name when labelled', () => {
    const dot = mount(MapDot, { props: { kind: 'user', x: 0, y: 0, label: 'Your location' } }).find('.ds-map-dot')
    expect(dot.attributes('role')).toBe('img')
    expect(dot.attributes('aria-label')).toBe('Your location')
    expect(dot.attributes('aria-hidden')).toBeUndefined()
  })
})

describe('MapHint', () => {
  it('renders the info icon and its slot', () => {
    const wrapper = mount(MapHint, { slots: { default: 'Zoom in to see more.' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.text()).toBe('Zoom in to see more.')
  })
})

describe('MapLegend', () => {
  it('shows an offers marker and a plain marker with the default labels', () => {
    const wrapper = mount(MapLegend)
    const markers = wrapper.findAll('.ds-map-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].classes()).toContain('ds-map-marker--offers')
    expect(markers[0].text()).toBe('Lunch offers today')
    expect(markers[1].classes()).toContain('ds-map-marker--plain')
    expect(markers[1].text()).toBe('No offers today')
  })
})
