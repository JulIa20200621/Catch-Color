import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { app2Moods } from '../data/app2Mock';
import { Screen } from '../components/Screen';
import { useAppStore } from '../store/useAppStore';
import { loadMoodRecords, saveMoodRecord } from '../services/supabaseData';
import { colors } from '../theme/colors';
import type { MainTabParamList, MoodType, PhotoRecord } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Diary'>;
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const moodKeys: MoodType[] = ['sad', 'restless', 'calm', 'happy', 'excited'];

function toDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calendarCells(month: Date): Array<number | null> {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array<null>(firstDay).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
}

// Native translation of app-2/pages/DiaryPage.tsx, showing only actual local user records.
export function DiaryScreen(_props: Props) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState('');
  const savedMoods = useAppStore((state) => state.moods);
  const saveMood = useAppStore((state) => state.saveMood);
  const setMoods = useAppStore((state) => state.setMoods);
  const account = useAppStore((state) => state.account);
  const photos = useAppStore((state) => state.photos);
  const photosByDate = useMemo(() => {
    const grouped = new Map<string, PhotoRecord[]>();
    photos.forEach((photo) => {
      const key = toDateKey(photo.createdAt);
      if (key) grouped.set(key, [...(grouped.get(key) ?? []), photo]);
    });
    return grouped;
  }, [photos]);
  const cells = useMemo(() => calendarCells(visibleMonth), [visibleMonth]);
  const dayPhotos = photosByDate.get(selectedDate) ?? [];
  const savedEntry = savedMoods[selectedDate];
  const monthPhotoDays = useMemo(() => {
    const prefix = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}-`;
    return [...photosByDate.keys()].filter((key) => key.startsWith(prefix)).length;
  }, [photosByDate, visibleMonth]);

  useEffect(() => {
    setMood(savedEntry ? moodKeys.indexOf(savedEntry.mood) : null);
    setText(savedEntry?.note ?? '');
  }, [savedEntry, selectedDate]);

  useEffect(() => {
    if (!account?.id) return;
    void loadMoodRecords(account.id).then(setMoods).catch((error) => console.warn('Load moods failed', error));
  }, [account?.id, setMoods]);

  const chooseDay = (day: number) => setSelectedDate(`${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  const changeMonth = (offset: number) => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(toDateKey(next));
  };
  const save = async () => {
    if (mood === null && !text.trim()) return;
    const record = { date: selectedDate, mood: moodKeys[mood ?? 2], note: text.trim() };
    if (!account?.id) return;
    await saveMoodRecord(account.id, record);
    saveMood(record);
  };

  return <Screen><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <View style={styles.card}><View style={styles.calendarHeader}><Pressable style={styles.monthButton} onPress={() => changeMonth(-1)}><Text style={styles.monthArrow}>‹</Text></Pressable><View><Text style={styles.cardTitle}>{visibleMonth.getFullYear()} 年 {visibleMonth.getMonth() + 1} 月</Text><Text style={styles.monthMeta}>本月 {monthPhotoDays} 天有色彩足迹</Text></View><Pressable style={styles.monthButton} onPress={() => changeMonth(1)}><Text style={styles.monthArrow}>›</Text></Pressable></View><View style={styles.calendar}>{weekDays.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}{cells.map((day, index) => { if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />; const key = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const dayPhotoRecords = photosByDate.get(key) ?? []; const selected = key === selectedDate; const entry = savedMoods[key]; return <Pressable key={key} style={styles.dayCell} onPress={() => chooseDay(day)}><View style={[styles.dayCircle, selected && styles.daySelected]}><Text style={[styles.dayNumber, selected && styles.dayNumberSelected, !selected && dayPhotoRecords.length === 0 && !entry && styles.dayEmpty]}>{day}</Text></View><View style={styles.dayMarks}>{entry ? <Text style={styles.diaryMark}>✎</Text> : null}{dayPhotoRecords.slice(0, entry ? 2 : 3).map((photo) => <View key={photo.id} style={[styles.mark, { backgroundColor: photo.target.colorHex }]} />)}</View></Pressable>; })}</View></View>
    <View style={styles.card}><View style={styles.diaryHeader}><Text style={styles.cardTitle}>{selectedDate.replaceAll('-', '.')} · 手帐</Text><Text style={styles.pen}>✎</Text></View>{dayPhotos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>{dayPhotos.map((photo) => <Image key={photo.id} source={{ uri: photo.imageUri }} style={styles.dayPhoto} />)}</ScrollView> : <Text style={styles.emptyDay}>这一天还没有色彩足迹，去散散步吧。</Text>}<Text style={styles.moodLabel}>那天的心情</Text><View style={styles.moodRow}>{app2Moods.map(([emoji, label], index) => <Pressable key={label} style={[styles.mood, mood === index && styles.moodSelected]} onPress={() => setMood(index)}><Text style={styles.moodEmoji}>{emoji}</Text><Text style={[styles.moodText, mood === index && styles.moodTextSelected]}>{label}</Text></Pressable>)}</View><TextInput value={text} onChangeText={setText} multiline placeholder="写几句今天的想法…" placeholderTextColor="#B4A88E" style={styles.input} /><Pressable style={styles.save} onPress={() => void save()}><Text style={styles.saveText}>{savedEntry ? '更新手帐' : '写好啦'}</Text></Pressable></View>
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingTop: 10, paddingBottom: 96, gap: 16 }, card: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, shadowColor: '#3C3732', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }, calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, monthButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, monthArrow: { color: colors.ink, fontSize: 24, lineHeight: 25 }, cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', textAlign: 'center' }, monthMeta: { marginTop: 3, color: colors.inkMuted, fontSize: 10, fontWeight: '500' }, calendar: { marginTop: 14, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }, weekday: { width: '14.285%', color: colors.inkMuted, textAlign: 'center', fontSize: 10, fontWeight: '500' }, dayCell: { width: '14.285%', height: 40, alignItems: 'center', gap: 2 }, dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, daySelected: { backgroundColor: '#2E2E31' }, dayNumber: { color: colors.ink, fontSize: 12, fontWeight: '600' }, dayNumberSelected: { color: colors.white }, dayEmpty: { color: '#B4A88E', fontWeight: '500' }, dayMarks: { height: 6, flexDirection: 'row', gap: 2, alignItems: 'center' }, mark: { width: 6, height: 6, borderRadius: 3 }, diaryMark: { color: colors.inkMuted, fontSize: 8, fontWeight: '700' }, diaryHeader: { flexDirection: 'row', justifyContent: 'space-between' }, pen: { color: colors.inkMuted, fontSize: 16 }, photoStrip: { marginTop: 12, gap: 8 }, dayPhoto: { width: 80, height: 80, borderRadius: 12, backgroundColor: colors.line }, emptyDay: { marginTop: 12, padding: 12, borderRadius: 12, color: colors.inkMuted, textAlign: 'center', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.6)' }, moodLabel: { marginTop: 16, color: colors.ink, fontSize: 11, fontWeight: '700', opacity: 0.7 }, moodRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }, mood: { width: '18%', alignItems: 'center', paddingVertical: 5, borderRadius: 16 }, moodSelected: { backgroundColor: 'rgba(255,255,255,0.85)' }, moodEmoji: { fontSize: 21 }, moodText: { marginTop: 3, color: colors.inkMuted, fontSize: 8, fontWeight: '500', textAlign: 'center' }, moodTextSelected: { color: colors.ink, fontWeight: '700' }, input: { minHeight: 78, marginTop: 16, padding: 12, borderRadius: 12, color: colors.ink, backgroundColor: 'rgba(255,255,255,0.7)', textAlignVertical: 'top', fontSize: 12, lineHeight: 18 }, save: { height: 44, marginTop: 12, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, saveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
