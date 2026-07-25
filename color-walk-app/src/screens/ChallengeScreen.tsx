import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import type { ChallengeState, RootStackParamList } from '../types';
import { toLocalDateString } from '../utils/date';
import { createChallenge as createRemoteChallenge, getTodayChallenge, joinChallenge } from '../services/supabaseData';

type Props = NativeStackScreenProps<RootStackParamList, 'Challenge'>;

export function ChallengeScreen({ navigation }: Props) {
  const [mode, setMode] = useState<ChallengeState['mode']>('same_color');
  const [testOpponentName, setTestOpponentName] = useState('测试搭子');
  const [inviteInput, setInviteInput] = useState('');
  const challenge = useAppStore((state) => state.challenge);
  const setChallenge = useAppStore((state) => state.setChallenge);
  const photos = useAppStore((state) => state.photos);
  const account = useAppStore((state) => state.account);
  const dailyTarget = useAppStore((state) => state.dailyTarget);
  const today = toLocalDateString();
  const myProgress = useMemo(
    () => photos.filter((photo) => toLocalDateString(photo.createdAt) === today && photo.analysis.success).length,
    [photos, today],
  );

  const activeChallenge = challenge?.date === today ? challenge : null;

  useEffect(() => {
    if (!account?.id) return;
    void getTodayChallenge(account.id).then((remote) => {
      if (remote) setChallenge({ id: remote.id, inviteCode: remote.inviteCode, mode: remote.mode, opponentName: remote.opponentName, opponentProgress: remote.opponentProgress, status: remote.status === 'active' ? 'active' : 'inviting', date: today });
    }).catch((error) => console.warn('Load challenge failed', error));
  }, [account?.id, setChallenge, today]);

  const createChallenge = async () => {
    if (!account?.id) return;
    try {
      const next = await createRemoteChallenge(account.id, mode, dailyTarget);
      setChallenge({ id: next.id, inviteCode: next.inviteCode, mode, opponentName: null, opponentProgress: 0, status: 'inviting', date: today });
    } catch (error) { Alert.alert('创建挑战失败', error instanceof Error ? error.message : '请稍后重试'); }
  };

  const joinByCode = async () => {
    if (!account?.id || !inviteInput.trim()) return;
    try { await joinChallenge(account.id, inviteInput); const remote = await getTodayChallenge(account.id); if (remote) setChallenge({ id: remote.id, inviteCode: remote.inviteCode, mode: remote.mode, opponentName: remote.opponentName, opponentProgress: remote.opponentProgress, status: 'active', date: today }); }
    catch (error) { Alert.alert('加入挑战失败', error instanceof Error ? error.message : '请稍后重试'); }
  };

  const shareChallenge = async () => {
    if (!activeChallenge) return;
    await Share.share({
      message: `加入我的 Color Walk 今日挑战，口令：${activeChallenge.inviteCode}`,
    });
  };

  const simulateJoin = () => {
    if (!activeChallenge) return;
    setChallenge({
      ...activeChallenge,
      opponentName: testOpponentName.trim() || '测试搭子',
      opponentProgress: Math.max(1, Math.floor(myProgress * 0.7)),
      status: 'active',
    });
  };

  return (
    <Screen>
      <View style={styles.page}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={23} color={colors.ink} />
        </Pressable>
        <Text style={styles.eyebrow}>DAILY CHALLENGE</Text>
        <Text style={styles.title}>今日颜色搭子</Text>
        <Text style={styles.subtitle}>挑战在今日 23:59 自动结束，每人同日只保留一个搭子。</Text>

        {activeChallenge ? (
          <>
            <View style={styles.scoreBoard}>
              <View style={styles.scoreItem}>
                <Text style={styles.score}>{myProgress}</Text>
                <Text style={styles.scoreLabel}>我的捕获</Text>
              </View>
              <Text style={styles.versus}>VS</Text>
              <View style={styles.scoreItem}>
                <Text style={styles.score}>{activeChallenge.opponentProgress}</Text>
                <Text style={styles.scoreLabel}>{activeChallenge.opponentName ?? '等待加入'}</Text>
              </View>
            </View>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>挑战口令</Text>
              <Text style={styles.code}>{activeChallenge.inviteCode}</Text>
              <Text style={styles.modeLabel}>
                {activeChallenge.mode === 'same_color' ? '共同寻找今日全网色' : '各自寻找专属色'}
              </Text>
            </View>
            <PrimaryButton label="分享挑战口令" icon="share-social-outline" onPress={() => void shareChallenge()} />
            {activeChallenge.status === 'inviting' ? <View style={styles.testCard}><Text style={styles.testTitle}>本机测试 PK</Text><Text style={styles.testCopy}>正式上线时，朋友可通过这条口令在自己的设备加入。现在可用模拟搭子完整预览对战状态。</Text><TextInput value={testOpponentName} onChangeText={setTestOpponentName} maxLength={12} placeholder="搭子昵称" placeholderTextColor={colors.inkMuted} style={styles.testInput} /><Pressable style={styles.testButton} onPress={simulateJoin}><Text style={styles.testButtonText}>模拟好友加入</Text></Pressable></View> : <Text style={styles.activeHint}>挑战已开始，双方当天成功捕捉的照片会自动计入进度。</Text>}
            <PrimaryButton
              label="结束今日挑战"
              icon="close-circle-outline"
              variant="secondary"
              onPress={() => setChallenge(null)}
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>选择规则</Text>
            <Pressable
              style={[styles.modeCard, mode === 'same_color' && styles.modeCardActive]}
              onPress={() => setMode('same_color')}
            >
              <Ionicons name="link-outline" size={25} color={colors.coralDark} />
              <View style={styles.modeTextWrap}>
                <Text style={styles.modeTitle}>共同寻找今日色</Text>
                <Text style={styles.modeDescription}>双方使用同一个全网限定色。</Text>
              </View>
              <Ionicons name={mode === 'same_color' ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.coralDark} />
            </Pressable>
            <Pressable
              style={[styles.modeCard, mode === 'own_color' && styles.modeCardActive]}
              onPress={() => setMode('own_color')}
            >
              <Ionicons name="git-compare-outline" size={25} color={colors.blue} />
              <View style={styles.modeTextWrap}>
                <Text style={styles.modeTitle}>各自寻找专属色</Text>
                <Text style={styles.modeDescription}>双方保留自己当天的颜色。</Text>
              </View>
              <Ionicons name={mode === 'own_color' ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.blue} />
            </Pressable>
            <PrimaryButton label="生成挑战口令" icon="people-outline" onPress={() => void createChallenge()} />
            <TextInput value={inviteInput} onChangeText={setInviteInput} autoCapitalize="characters" placeholder="输入朋友的邀请码" placeholderTextColor={colors.inkMuted} style={styles.joinInput} />
            <Pressable style={styles.joinButton} onPress={() => void joinByCode}><Text style={styles.joinButtonText}>加入朋友的 PK</Text></Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, gap: 16 },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.coralDark, fontSize: 11, fontWeight: '900', marginTop: 8 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, lineHeight: 21, marginBottom: 4 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 8 },
  modeCard: { minHeight: 82, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeCardActive: { borderColor: colors.coral, borderWidth: 2 },
  modeTextWrap: { flex: 1 },
  modeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  modeDescription: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
  scoreBoard: { minHeight: 150, backgroundColor: colors.ink, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 20 },
  scoreItem: { alignItems: 'center', gap: 4, minWidth: 90 },
  score: { color: colors.white, fontSize: 46, fontWeight: '900' },
  scoreLabel: { color: '#D6D0C5', fontSize: 12 },
  versus: { color: colors.lime, fontWeight: '900' },
  codeCard: { padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, alignItems: 'center', gap: 6 },
  codeLabel: { color: colors.inkMuted, fontSize: 12 },
  code: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  modeLabel: { color: colors.coralDark, fontSize: 12, fontWeight: '700' },
  testCard: { padding: 15, borderRadius: 18, backgroundColor: '#F8EEE5', gap: 8 },
  testTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  testCopy: { color: colors.inkMuted, fontSize: 11, lineHeight: 17 },
  testInput: { height: 40, paddingHorizontal: 12, borderRadius: 12, color: colors.ink, backgroundColor: colors.white, fontSize: 12 },
  testButton: { height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coral },
  testButtonText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  activeHint: { padding: 12, borderRadius: 14, color: colors.inkMuted, textAlign: 'center', fontSize: 11, lineHeight: 17, backgroundColor: '#F0F5E9' },
  joinInput: { height: 44, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 14, color: colors.ink, backgroundColor: colors.surface, fontSize: 12 },
  joinButton: { height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong },
  joinButtonText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
});
