import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Switch from './Switch.vue'
import Checkbox from './Checkbox.vue'

describe('Switch', () => {
  it('toggles via v-model on activation', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false, label: 'Public' } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('renders its label and respects disabled', () => {
    const wrapper = mount(Switch, { props: { modelValue: false, label: 'Public', disabled: true } })
    expect(wrapper.text()).toContain('Public')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ds-switch').classes()).toContain('ds-switch--disabled')
  })
})

describe('Checkbox', () => {
  it('toggles via v-model on activation', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, label: 'Bistro' } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('shows the check glyph when checked', () => {
    const off = mount(Checkbox, { props: { modelValue: false } })
    expect(off.find('.ds-checkbox__box svg').exists()).toBe(false)
    const on = mount(Checkbox, { props: { modelValue: true } })
    expect(on.find('.ds-checkbox__box svg').exists()).toBe(true)
  })

  it('respects disabled', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})
