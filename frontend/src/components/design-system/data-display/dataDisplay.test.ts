import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'
import Badge from './Badge.vue'
import Tag from './Tag.vue'

describe('Card', () => {
  it('renders slot content', () => {
    const wrapper = mount(Card, { slots: { default: 'Body' } })
    expect(wrapper.find('.ds-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Body')
  })

  it('applies the hoverable modifier and custom padding', () => {
    const wrapper = mount(Card, { props: { hoverable: true, padding: '8px' } })
    const card = wrapper.find('.ds-card')
    expect(card.classes()).toContain('ds-card--hoverable')
    expect(card.attributes('style')).toContain('padding: 8px')
  })
})

describe('Badge', () => {
  const TONES = ['neutral', 'accent', 'success', 'warning', 'danger'] as const

  it.each(TONES)('renders tone "%s" without error', (tone) => {
    const wrapper = mount(Badge, { props: { tone }, slots: { default: 'Live' } })
    expect(wrapper.find('.ds-badge').classes()).toContain(`ds-badge--${tone}`)
  })

  it('renders an icon glyph when icon is set', () => {
    const wrapper = mount(Badge, { props: { icon: 'info' }, slots: { default: 'Beta' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('defaults to the neutral tone', () => {
    const wrapper = mount(Badge, { slots: { default: 'X' } })
    expect(wrapper.find('.ds-badge').classes()).toContain('ds-badge--neutral')
  })
})

describe('Tag', () => {
  it('renders slot content as a chip', () => {
    const wrapper = mount(Tag, { slots: { default: 'Tallinn' } })
    expect(wrapper.find('.ds-tag').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tallinn')
  })

  it('shows the selected treatment', () => {
    const wrapper = mount(Tag, { props: { selected: true }, slots: { default: 'design' } })
    expect(wrapper.find('.ds-tag').classes()).toContain('ds-tag--selected')
  })

  it('does not render a remove affordance by default', () => {
    const wrapper = mount(Tag, { slots: { default: 'design' } })
    expect(wrapper.find('.ds-tag__remove').exists()).toBe(false)
  })

  it('emits remove when the remove affordance is activated', async () => {
    const wrapper = mount(Tag, { props: { removable: true }, slots: { default: 'design' } })
    await wrapper.find('.ds-tag__remove').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})
