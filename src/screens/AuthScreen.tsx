// ============================================
// Onerepi - Auth Screen
// Login / Signup with social providers
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { setOnboardingCompleted } from '../lib/storage';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { supabaseService } from '../lib/supabase-service';

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  primarySoft: '#FFF0E8',
  cream: '#FFF8E7',
  warmBrown: '#8B7355',
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  border: '#E8E8E8',
  surface: '#FAFAFA',
  google: '#4285F4',
  line: '#00C300',
  apple: '#000000',
};

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

type AuthMode = 'login' | 'signup';

// Small frying pan logo
const OnerepiLogoSmall = () => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Circle cx="18" cy="22" r="13" fill={brandColors.primary} />
    <Circle cx="18" cy="22" r="9" fill="none" stroke={brandColors.white} strokeWidth="2" />
    <Path d="M31 22 L40 19" stroke={brandColors.primary} strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

// Social Icons
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

const LineIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
      fill={brandColors.line}
    />
  </Svg>
);

const AppleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      fill={brandColors.apple}
    />
  </Svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSwitch = (newMode: AuthMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);
  };

  const handleSocialLogin = async (provider: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement actual social login with Supabase OAuth
    Alert.alert(
      '準備中',
      `${provider}ログインは現在準備中です。\nメールアドレスでログインしてください。`
    );
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    // パスワードの長さチェック（Supabaseは最低6文字）
    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上で入力してください。');
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('入力エラー', '有効なメールアドレスを入力してください。');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // 新規登録
        const { data, error } = await signUpWithEmail(email.trim(), password);

        if (error) {
          // エラーメッセージを日本語化
          let errorMessage = 'アカウント作成に失敗しました。';
          if (error.message.includes('already registered')) {
            errorMessage = 'このメールアドレスは既に登録されています。ログインしてください。';
          } else if (error.message.includes('invalid')) {
            errorMessage = '無効なメールアドレスです。';
          } else if (error.message.includes('password')) {
            errorMessage = 'パスワードが短すぎます。6文字以上にしてください。';
          }
          Alert.alert('登録エラー', errorMessage);
          setIsLoading(false);
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // メール確認が必要な場合
        if (data?.user && !data.session) {
          Alert.alert(
            '確認メールを送信しました',
            'メールアドレスに確認メールを送信しました。リンクをクリックして登録を完了してください。',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }

        // セッションがある場合は即時ログイン
        if (data?.session) {
          await setOnboardingCompleted(true);
          // ローカルデータをクラウドに同期
          await supabaseService.syncLocalDataToCloud();
          navigation.replace('MainTabs');
        }
      } else {
        // ログイン
        const { data, error } = await signInWithEmail(email.trim(), password);

        if (error) {
          // エラーメッセージを日本語化
          let errorMessage = 'ログインに失敗しました。';
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'メールアドレスが確認されていません。確認メールをご確認ください。';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください。';
          }
          Alert.alert('ログインエラー', errorMessage);
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await setOnboardingCompleted(true);
          // ローカルデータをクラウドに同期
          await supabaseService.syncLocalDataToCloud();
          navigation.replace('MainTabs');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('エラー', '認証中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!email.trim()) {
      Alert.alert(
        'メールアドレスを入力',
        'パスワードリセット用のメールを送信するために、メールアドレスを入力してください。'
      );
      return;
    }

    Alert.alert(
      'パスワードリセット',
      `${email}にパスワードリセットのメールを送信しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '送信',
          onPress: async () => {
            try {
              // Supabaseのパスワードリセット機能を使用
              const { supabase } = await import('../lib/supabase');
              const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

              if (error) {
                Alert.alert('エラー', 'リセットメールの送信に失敗しました。');
                return;
              }

              Alert.alert(
                'メール送信完了',
                'パスワードリセット用のメールを送信しました。メールをご確認ください。'
              );
            } catch (err) {
              Alert.alert('エラー', 'リセットメールの送信に失敗しました。');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <OnerepiLogoSmall />
              <Text style={styles.logoText}>ONEREPI</Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, mode === 'login' && styles.tabActive]}
                onPress={() => handleModeSwitch('login')}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'login' && styles.tabTextActive,
                  ]}
                >
                  ログイン
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'signup' && styles.tabActive]}
                onPress={() => handleModeSwitch('signup')}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'signup' && styles.tabTextActive,
                  ]}
                >
                  新規登録
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Google')}
                activeOpacity={0.7}
              >
                <GoogleIcon />
                <Text style={styles.socialButtonText}>Googleで続ける</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('LINE')}
                activeOpacity={0.7}
              >
                <LineIcon />
                <Text style={styles.socialButtonText}>LINEで続ける</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Apple')}
                activeOpacity={0.7}
              >
                <AppleIcon />
                <Text style={styles.socialButtonText}>Appleで続ける</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>メールアドレス</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={brandColors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>パスワード</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={brandColors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={brandColors.textMuted} />
                    ) : (
                      <Eye size={20} color={brandColors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {mode === 'login' && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    パスワードをお忘れですか？
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleEmailAuth}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading
                    ? (mode === 'login' ? 'ログイン中...' : '登録中...')
                    : (mode === 'login' ? 'ログイン' : '新規登録')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: brandColors.primary,
    letterSpacing: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: brandColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.textMuted,
  },
  tabTextActive: {
    color: brandColors.primary,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.white,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.text,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: brandColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.text,
  },
  input: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brandColors.text,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brandColors.text,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
  submitButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: brandColors.textMuted,
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.white,
  },
});
