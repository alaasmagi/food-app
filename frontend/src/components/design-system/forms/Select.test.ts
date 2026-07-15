import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from './Select.vue'

const options = [
  { value: 'all', label: 'All environments' },
  { value: 'e1', label: 'Work' },
]

describe('Select', () => {
  it('opens, emits update:modelValue on choosing, and closes', async () => {
    const wrapper = mount(Select, { props: { options, modelValue: 'all' } })
    await wrapper.find('.ds-select__trigger').trigger('click')
    expect(wrapper.find('.ds-select__list').exists()).toBe(true)

    await wrapper.findAll('.ds-select__option')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['e1'])
    expect(wrapper.find('.ds-select__list').exists()).toBe(false)
  })

  it('shows the placeholder when the value matches no option', () => {
    const wrapper = mount(Select, {
      props: { options, modelValue: 'missing', placeholder: 'Choose one' },
    })
    expect(wrapper.find('.ds-select__value--placeholder').text()).toBe('Choose one')
  })

  it('shows the selected option label', () => {
    const wrapper = mount(Select, { props: { options, modelValue: 'e1' } })
    expect(wrapper.find('.ds-select__value').text()).toBe('Work')
  })

  it('does not open when disabled', async () => {
    const wrapper = mount(Select, { props: { options, modelValue: 'all', disabled: true } })
    await wrapper.find('.ds-select__trigger').trigger('click')
    expect(wrapper.find('.ds-select__list').exists()).toBe(false)
  })
})
