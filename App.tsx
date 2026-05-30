import React from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import ReportScreen from './src/screens/ReportScreen';
import StudyScreen from './src/screens/StudyScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

function Placeholder({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
    </View>
  );
}
const CoachScreen = () => <Placeholder title="Coach" />;
const YouScreen = () => <Placeholder title="You" />;

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '\u2302', Live: '\u25CE', Report: '\u229E', Study: '\u25A3', Coach: '\u2726', You: '\u25CB' };
  const tint = focused ? colors.violet : colors.textMuted;
  return (
    <View style={{ alignItems: 'center', width: 60 }}>
      <Text style={[styles.iconText, { color: tint }]}>{icons[label] || '\u2022'}</Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
      <NavigationContainer>
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
          <Tab.Screen name="You" component={YouScreen} />
        </Tab.Navigator>
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
