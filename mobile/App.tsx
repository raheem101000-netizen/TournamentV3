import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { ProfileScreen, FriendsScreen } from './modules/profiles';
import { ThreadsListScreen, ChatScreen } from './modules/messaging';
import { DiscoveryScreen } from './modules/discovery';
import { NotificationsScreen } from './modules/notifications';
import { initializeModules } from './lib/initializeModules';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
  </Stack.Navigator>
);

const MessagingStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ThreadsList" component={ThreadsListScreen} options={{ title: 'Messages' }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
  </Stack.Navigator>
);

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await initializeModules();
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: '#6B7280',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{ tabBarLabel: 'Discover' }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagingStack}
          options={{ tabBarLabel: 'Messages' }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ tabBarLabel: 'Alerts' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{ tabBarLabel: 'Profile' }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
