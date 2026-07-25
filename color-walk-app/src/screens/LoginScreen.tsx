import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { IslandPrimaryButton } from '../components/IslandPrimaryButton';
import { colors } from '../theme/colors';

interface Props {
  onLogin: (email: string, password: string, register: boolean) => Promise<{ needsEmailConfirmation: boolean }>
}

// Direct native translation of app-2/pages/LoginPage.tsx, backed by Supabase Email Auth.
export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('提示', '请输入有效邮箱和至少 6 位密码');
      return;
    }
    setSubmitting(true);
    try {
      const result = await onLogin(email.trim().toLowerCase(), password, register);
      if (register && result.needsEmailConfirmation) {
        setPassword('');
        setRegister(false);
        Alert.alert('注册成功', '已向你的邮箱发送验证邮件。请完成验证后，回到此页面使用邮箱和密码登录。');
      }
    } catch (error) {
      Alert.alert(register ? '注册失败' : '登录失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.page}>
        <View style={styles.brand}>
          <View style={styles.logo}><Image source={require('../../assets/animal-island/item-022.png')} style={styles.logoImage} /></View>
          <Text style={styles.name}>Color Catch</Text>
          <Text style={styles.slogan}>抓住生活里的小颜色</Text>
        </View>
        <View style={styles.form}>
          <TextInput value={email} keyboardType="email-address" autoCapitalize="none" placeholder="邮箱" placeholderTextColor="#B4A88E" style={styles.input} onChangeText={setEmail} />
          <View style={styles.codeRow}>
            <TextInput value={password} secureTextEntry placeholder="密码（至少 6 位）" placeholderTextColor="#B4A88E" style={[styles.input, styles.codeInput]} onChangeText={setPassword} />
            <Pressable accessibilityLabel={register ? '切换到登录' : '切换到注册'} style={styles.codeButton} onPress={() => setRegister((value) => !value)}><Text style={styles.codeButtonText}>{register ? '去登录' : '去注册'}</Text></Pressable>
          </View>
          <IslandPrimaryButton label={submitting ? '请稍候…' : register ? '注册账户' : '登录'} onPress={() => void submit()} />
        </View>
        <View style={styles.otherRow}><View style={styles.line} /><Text style={styles.otherText}>其他登录方式</Text><View style={styles.line} /></View>
        <Pressable accessibilityLabel="注册说明" style={styles.wechat} onPress={() => Alert.alert('邮箱注册', '当前 Supabase 已开启邮箱认证，注册后请到邮箱完成确认。')}><Ionicons name="mail" size={21} color="#FFFFFF" /></Pressable>
        <Text style={styles.wechatText}>邮箱认证登录</Text>
        <Text style={styles.footer}>登录即代表同意《用户协议》和《隐私政策》{`\n`}请使用已注册的邮箱和密码登录</Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 32 },
  brand: { marginTop: 58, alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B2CCE2', shadowColor: '#46423C', shadowOpacity: 0.18, shadowRadius: 14, elevation: 4 },
  logoImage: { width: 58, height: 58, resizeMode: 'contain' },
  name: { marginTop: 20, color: colors.ink, fontSize: 26, fontWeight: '700' },
  slogan: { marginTop: 6, color: colors.inkMuted, fontSize: 12, fontWeight: '500' },
  form: { marginTop: 48, gap: 12 },
  input: { height: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.ink, fontSize: 14, fontWeight: '600' },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeInput: { flex: 1 },
  codeButton: { width: 104, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceStrong },
  codeButtonText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  otherRow: { marginTop: 32, flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { height: 1, flex: 1, backgroundColor: colors.line },
  otherText: { color: '#B4A88E', fontSize: 11, fontWeight: '500' },
  wechat: { alignSelf: 'center', marginTop: 20, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7EC67E' },
  wechatText: { marginTop: 8, color: colors.inkMuted, textAlign: 'center', fontSize: 11, fontWeight: '500' },
  footer: { marginTop: 'auto', marginBottom: 28, color: '#B4A88E', textAlign: 'center', fontSize: 10, lineHeight: 16, fontWeight: '500' },
});
