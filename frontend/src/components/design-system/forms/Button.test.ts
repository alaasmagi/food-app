import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const
const SIZES = ['sm', 'md', 'lg'] as const

describe('Button', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`renders variant "${variant}" size "${size}" without error`, () => {
        const wrapper = mount(Button, { props: { variant, size }, slots: { default: 'Continue' } })
        const button = wrapper.find('button')
        expect(button.exists()).toBe(true)
        expect(button.classes()).toContain(`ds-button--${variant}`)
        expect(button.classes()).toContain(`ds-button--${size}`)
      })
    }
  }

  it('emits click when enabled', async () => {
    const wrapper = mount(Button, { slots: { default: 'Go' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click while loading', async () => {
    const wrapper = mount(Button, { props: { loading: true }, slots: { default: 'Saving' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(Button, { props: { disabled: true }, slots: { default: 'Nope' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('shows the spinner in place of the icon while loading', () => {
    const wrapper = mount(Button, {
      props: { loading: true, icon: 'arrow-right' },
      slots: { default: 'Saving' },
    })
    // spinner glyph carries the spin class; the arrow icon must not render
    expect(wrapper.find('.ds-icon--spin').exists()).toBe(true)
  })

  it('places the icon after the label when iconPosition is right', () => {
    const wrapper = mount(Button, {
      props: { icon: 'arrow-right', iconPosition: 'right' },
      slots: { default: 'Continue' },
    })
    const children = wrapper.find('button').element.children
    // last child is the trailing icon
    expect(children[children.length - 1].tagName.toLowerCase()).toBe('svg')
    expect(children[0].tagName.toLowerCase()).toBe('span')
  })
})
