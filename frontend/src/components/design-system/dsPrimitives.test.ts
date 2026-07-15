import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from './forms/Input.vue'
import Tabs from './navigation/Tabs.vue'
import Dialog from './feedback/Dialog.vue'

describe('Input', () => {
  it('emits update:modelValue on typing', async () => {
    const wrapper = mount(Input, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('Work')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Work'])
  })

  it('renders a textarea when multiline', () => {
    const wrapper = mount(Input, { props: { modelValue: '', multiline: true } })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('shows the error message with the danger treatment, overriding hint', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', hint: 'Optional', error: 'Required' },
    })
    expect(wrapper.text()).toContain('Required')
    expect(wrapper.text()).not.toContain('Optional')
    expect(wrapper.find('.ds-input__field--error').exists()).toBe(true)
  })

  it('renders a leading icon on single-line inputs', () => {
    const wrapper = mount(Input, { props: { modelValue: '', icon: 'search' } })
    expect(wrapper.find('.ds-input__icon svg').exists()).toBe(true)
  })
})

describe('Tabs', () => {
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'work', label: 'Work' },
  ]

  it('renders a tab per item and marks the active one', () => {
    const wrapper = mount(Tabs, { props: { tabs, modelValue: 'all' } })
    const buttons = wrapper.findAll('.ds-tabs__tab')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].classes()).toContain('ds-tabs__tab--active')
  })

  it('emits update:modelValue on tab activation', async () => {
    const wrapper = mount(Tabs, { props: { tabs, modelValue: 'all' } })
    await wrapper.findAll('.ds-tabs__tab')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['work'])
  })
})

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const wrapper = mount(Dialog, { props: { open: false } })
    expect(wrapper.find('.ds-dialog__overlay').exists()).toBe(false)
  })

  it('renders title, body slot, and footer slot when open', () => {
    const wrapper = mount(Dialog, {
      props: { open: true, title: 'Manage environments' },
      slots: { default: 'Body copy', footer: 'Footer actions' },
    })
    expect(wrapper.find('.ds-dialog__overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Manage environments')
    expect(wrapper.text()).toContain('Body copy')
    expect(wrapper.find('.ds-dialog__footer').text()).toContain('Footer actions')
  })

  it('emits close when the close button is activated', async () => {
    const wrapper = mount(Dialog, { props: { open: true, title: 'X' } })
    await wrapper.find('.ds-dialog__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when the overlay backdrop is clicked', async () => {
    const wrapper = mount(Dialog, { props: { open: true, title: 'X' } })
    await wrapper.find('.ds-dialog__overlay').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
