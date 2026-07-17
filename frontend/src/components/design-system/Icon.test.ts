import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon, { type IconName } from './Icon.vue'

const NAMES: IconName[] = [
  'chevron-down',
  'chevron-right',
  'chevron-up',
  'check',
  'x',
  'plus',
  'minus',
  'search',
  'info',
  'alert-triangle',
  'alert-circle',
  'check-circle',
  'arrow-right',
  'spinner',
  'link',
]

describe('Icon', () => {
  it.each(NAMES)('renders "%s" without error', (name) => {
    const wrapper = mount(Icon, { props: { name } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('defaults to a 16px square with viewBox 0 0 24 24', () => {
    const svg = mount(Icon, { props: { name: 'check' } }).find('svg')
    expect(svg.attributes('width')).toBe('16')
    expect(svg.attributes('height')).toBe('16')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
  })

  it('inherits color via currentColor by default', () => {
    const svg = mount(Icon, { props: { name: 'check' } }).find('svg')
    expect(svg.attributes('stroke')).toBe('currentColor')
  })

  it('applies the spin class only for the spinner glyph', () => {
    expect(mount(Icon, { props: { name: 'spinner' } }).find('svg').classes()).toContain(
      'ds-icon--spin',
    )
    expect(mount(Icon, { props: { name: 'check' } }).find('svg').classes()).not.toContain(
      'ds-icon--spin',
    )
  })
})
