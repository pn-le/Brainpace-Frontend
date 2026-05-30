import React from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import ReportScreen from './src/screens/ReportScreen';
import StudyScreen from './src/screens/StudyScreen';
import ConnectScreen from './src/screens/ConnectScreen';
import BaselineScreen from './src/screens/BaselineScreen';
import LiveMonitorScreen from './src/screens/LiveMonitorScreen';
import RecoveryScreen from './src/screens/RecoveryScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import CoachScreen from './src/screens/CoachScreen';
import DebugScreen from './src/screens/DebugScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Placeholder({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
    </View>
  );
}
const YouScreen = () => <Placeholder title="You" />;

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '\u2302', Live: '\u25CE', Report: '\u229E',
    Study: '\u25A3', Coach: '\u2726', Debug: '\u2699', You: '\u25CB',
  };
  const tint = focused ? colors.violet : colors.textMuted;
  return (
    <View style={{ alignItems: 'center', width: 60 }}>
      <Text style={[styles.iconText, { color: tint }]}>{icons[label] || '\u2022'}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.violet,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Study" component={StudyScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Debug" component={DebugScreen} />
      <Tab.Screen name="You" component={YouScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Connect" component={ConnectScreen} />
          <Stack.Screen name="Baseline" component={BaselineScreen} />
          <Stack.Screen name="LiveMonitor" component={LiveMonitorScreen} />
          <Stack.Screen name="Recovery" component={RecoveryScreen} />
          <Stack.Screen name="Summary" component={SummaryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.inkCard,
    borderTopColor: colors.inkBorder,
    borderTopWidth: 1,
    height: 82,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '500', marginTop: 4 },
  iconText: { fontSize: 18 },
  placeholder: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});
