import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Dialog } from '@/components/design-system/feedback/Dialog';
import { Input } from '@/components/design-system/forms/Input';
import { Tabs } from '@/components/design-system/navigation/Tabs';

describe('Input', () => {
  it.each(['sm', 'md'] as const)('renders size "%s"', (size) => {
    render(<Input label="Name" placeholder="Type here" size={size} />);
    expect(screen.getByPlaceholderText('Type here')).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
  });

  it('reports typed text via onChangeText', () => {
    const onChangeText = jest.fn();
    render(<Input placeholder="Env name" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText('Env name'), 'Lunch spots');
    expect(onChangeText).toHaveBeenCalledWith('Lunch spots');
  });

  it('shows the error over the hint', () => {
    render(<Input hint="Optional" error="Required" />);
    expect(screen.getByText('Required')).toBeTruthy();
    expect(screen.queryByText('Optional')).toBeNull();
  });

  it('renders multiline', () => {
    render(<Input placeholder="Notes" multiline rows={4} />);
    expect(screen.getByPlaceholderText('Notes')).toBeTruthy();
  });
});

describe('Tabs', () => {
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'a', label: 'Lunch' },
    { value: 'b', label: 'Dinner' },
  ];

  it('renders one tab per item', () => {
    render(<Tabs tabs={tabs} defaultValue="all" />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Dinner')).toBeTruthy();
  });

  it('fires onChange with the selected value', () => {
    const onChange = jest.fn();
    render(<Tabs tabs={tabs} value="all" onChange={onChange} />);
    fireEvent.press(screen.getByText('Lunch'));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onClose={jest.fn()} title="Hidden">
        <Text>body</Text>
      </Dialog>,
    );
    expect(screen.queryByText('body')).toBeNull();
  });

  it('renders title, body, and footer when open', () => {
    render(
      <Dialog open onClose={jest.fn()} title="Edit environment" footer={<Text>Save</Text>}>
        <Text>body content</Text>
      </Dialog>,
    );
    expect(screen.getByText('Edit environment')).toBeTruthy();
    expect(screen.getByText('body content')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('closes on the close affordance', () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Edit">
        <Text>body</Text>
      </Dialog>,
    );
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
