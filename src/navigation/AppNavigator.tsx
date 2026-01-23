// ============================================
// Onerepi - App Navigator
// React Navigation setup with Tabs & Stack
// ============================================

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Calendar,
  ShoppingCart,
  BookOpen,
  User,
  Award,
} from 'lucide-react-native';
import { MobileContainer } from '../components/ui';

import {
  WelcomeScreen,
  OnboardingSlidesScreen,
  SetupScreen,
  AuthScreen,
  OnboardingScreen,
  WeeklyPlanScreen,
  ShoppingListScreen,
  CookingLogScreen,
  ProfileScreen,
  CookingScreen,
  DraftMeetingScreen,
  RecipeListScreen,
  RecipeDetailScreen,
  AIChatScreen,
  InventoryScreen,
  FavoritesScreen,
  AIRecipeScreen,
  CookingFeedbackScreen,
  PreferenceDiagnosisScreen,
  MyTypeScreen,
} from '../screens';
import { QuickOnboardingNavigator } from '../screens/quickOnboarding';
import { isQuickOnboardingCompleted } from '../lib/quickOnboarding';
import { RootStackParamList, MainTabParamList } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'WeeklyPlan':
              return <Calendar size={size} color={color} />;
            case 'ShoppingList':
              return <ShoppingCart size={size} color={color} />;
            case 'CookingLog':
              return <BookOpen size={size} color={color} />;
            case 'MyTypeTab':
              return <Award size={size} color={color} />;
            case 'Profile':
              return <User size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen
        name="WeeklyPlan"
        component={WeeklyPlanScreen}
        options={{ tabBarLabel: '献立' }}
      />
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ tabBarLabel: '買い物' }}
      />
      <Tab.Screen
        name="CookingLog"
        component={CookingLogScreen}
        options={{ tabBarLabel: '日記' }}
      />
      <Tab.Screen
        name="MyTypeTab"
        component={MyTypeScreen}
        options={{ tabBarLabel: 'タイプ' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '設定' }}
      />
    </Tab.Navigator>
  );
};

// QuickOnboarding Wrapper Component
const QuickOnboardingWrapper = ({ navigation }: any) => {
  const handleComplete = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return <QuickOnboardingNavigator onComplete={handleComplete} />;
};

// Root Stack Navigator
export const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedQuickOnboarding, setHasCompletedQuickOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const completed = await isQuickOnboardingCompleted();
        setHasCompletedQuickOnboarding(completed);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  if (isLoading) {
    return (
      <MobileContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <NavigationContainer>
        <Stack.Navigator
        initialRouteName={hasCompletedQuickOnboarding ? 'MainTabs' : 'QuickOnboarding'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Quick Onboarding - 初回3分体験 */}
        <Stack.Screen
          name="QuickOnboarding"
          component={QuickOnboardingWrapper}
          options={{
            animation: 'fade',
          }}
        />
        {/* Legacy Onboarding Flow */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="OnboardingSlides"
          component={OnboardingSlidesScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Setup"
          component={SetupScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        {/* Legacy Chat-based Onboarding */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="DraftMeeting"
          component={DraftMeetingScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Cooking"
          component={CookingScreen}
          options={{
            animation: 'fade',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="RecipeList"
          component={RecipeListScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="AIChat"
          component={AIChatScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="CookingLog"
          component={CookingLogScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="AIRecipe"
          component={AIRecipeScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="CookingFeedback"
          component={CookingFeedbackScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="PreferenceDiagnosis"
          component={PreferenceDiagnosisScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="MyType"
          component={MyTypeScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    height: 80,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
