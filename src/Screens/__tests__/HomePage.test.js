import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomePage from '../HomePage';
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

describe('<HomePage />', () => {
  it('renders correctly', async () => {
    const navigation = { setOptions: jest.fn() };

    const { toJSON } = await waitFor(() =>
      render(
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          }}
        >
          <NavigationContainer>
            <HomePage navigation={navigation} />
          </NavigationContainer>
        </SafeAreaProvider>,
      ),
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('links to about page', async () => {
    const navigate = jest.fn();

    const Stack = createStackNavigator();
    const { getByTestId } = await waitFor(() =>
      render(
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="HomePage"
              component={HomePage}
              listeners={({ navigation }) => ({
                transitionStart: (e) => {
                  navigation.navigate = navigate;
                },
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>,
      ),
    );

    fireEvent.press(getByTestId('aboutButton'));

    expect(navigate).toHaveBeenCalledWith('AboutPage');
  });
});
