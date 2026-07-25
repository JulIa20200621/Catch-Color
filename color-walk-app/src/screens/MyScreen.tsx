import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  app2Animals,
  app2Colors,
  app2Moods,
  getApp2Color,
} from "../data/app2Mock";
import { getAnimalAsset } from "../data/animalAssets";
import { Screen } from "../components/Screen";
import { useAppStore } from "../store/useAppStore";
import { getPhotoStats } from "../utils/photoStats";
import { colors } from "../theme/colors";
import type { MainTabParamList } from "../types";

type Props = BottomTabScreenProps<MainTabParamList, "Me">;

// Direct native translation of app-2/pages/ProfilePage.tsx.
export function MyScreen(_props: Props) {
  const [settings, setSettings] = useState(false);
  const [calmMode, setCalmMode] = useState(true);
  const [mood, setMood] = useState<number | null>(null);
  const [animal, setAnimal] = useState<(typeof app2Animals)[number] | null>(
    null,
  );
  const account = useAppStore((state) => state.account);
  const updateNickname = useAppStore((state) => state.updateNickname);
  const logout = useAppStore((state) => state.logout);
  const photos = useAppStore((state) => state.photos);
  const photoStats = getPhotoStats(photos);
  const [nicknameDraft, setNicknameDraft] = useState(
    account?.nickname ?? "小鹿",
  );
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsRow}>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setSettings(true)}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Image
              source={getAnimalAsset("fox")}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.name}>{account?.nickname ?? "小鹿"}</Text>
          <Text style={styles.level}>捉色师 · Lv.5</Text>
          <View style={styles.wallet}>
            <Text style={styles.walletText}>🎨 12,680</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.stats}>
            {[
              [photoStats.colorCount, "已捕捉颜色种类"],
              [photoStats.photoCount, "已拍摄照片"],
              [photoStats.capturedDays, "捕捉天数"],
            ].map(([value, label], index) => (
              <View
                key={String(label)}
                style={[styles.stat, index > 0 && styles.statBorder]}
              >
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        {calmMode ? (
          <View style={[styles.card, styles.calmCard]}>
            <Text style={styles.calmTitle}>今天散步后，心情怎么样？</Text>
            <View style={styles.moodRow}>
              {app2Moods.map(([emoji, label], index) => (
                <Pressable
                  key={label}
                  style={[styles.mood, mood === index && styles.moodSelected]}
                  onPress={() => setMood(index)}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                  <Text style={styles.moodLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {mood !== null ? (
              <Text style={styles.moodMessage}>
                把这份心情好好存进色彩手帐里 🐾
              </Text>
            ) : null}
          </View>
        ) : null}
        <Text style={[styles.sectionTitle, styles.tealTitle]}>
          我的专属色盘
        </Text>
        <View style={styles.card}>
          <View style={styles.palette}>
            {app2Colors.map((color) => (
              <View key={color.id} style={styles.paletteItem}>
                <View
                  style={[styles.paletteDot, { backgroundColor: color.hex }]}
                />
                <Text style={styles.paletteName}>{color.name.slice(0, 2)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionTitle, styles.pinkTitle]}>动物伙伴</Text>
          <Text style={styles.count}>6 / 12</Text>
        </View>
        <View style={styles.animals}>
          {app2Animals.map((item, index) => {
            const [id, name, emoji, unlocked] = item;
            const color = getApp2Color(app2Colors[index].id);
            const animalAsset = getAnimalAsset(id);
            return (
              <Pressable
                key={id}
                style={styles.animalItem}
                onPress={() => setAnimal(item)}
              >
                <View
                  style={[
                    styles.animalCircle,
                    unlocked
                      ? { backgroundColor: color.soft }
                      : styles.animalLocked,
                  ]}
                >
                  {animalAsset ? (
                    <Image
                      source={animalAsset}
                      style={[
                        styles.animalImage,
                        !unlocked && styles.animalEmojiLocked,
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.animalEmoji,
                        !unlocked && styles.animalEmojiLocked,
                      ]}
                    >
                      {emoji}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.animalName,
                    !unlocked && styles.animalNameLocked,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.animalHint}>
          同一种颜色还可能遇见更多伙伴，敬请期待 🐾
        </Text>
        <Modal
          visible={settings}
          transparent
          animationType="slide"
          onRequestClose={() => setSettings(false)}
        >
          <Pressable style={styles.mask} onPress={() => setSettings(false)}>
            <Pressable style={styles.drawer} onPress={(event) => event.stopPropagation()}>
              <View style={styles.handle} />
              <Text style={styles.drawerTitle}>设置</Text>
              <View style={styles.group}>
                <View style={styles.row}>
                  <Text style={styles.rowText}>昵称</Text>
                  <TextInput
                    value={nicknameDraft}
                    maxLength={12}
                    style={styles.nicknameInput}
                    onChangeText={setNicknameDraft}
                    onBlur={() => updateNickname(nicknameDraft)}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowText}>手机号</Text>
                  <Text style={styles.rowValue}>
                    {account?.phone === "wechat-demo"
                      ? "微信一键登录"
                      : (account?.phone ?? "未绑定")}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowText}>微信</Text>
                  <Text style={[styles.rowValue, styles.bound]}>已绑定 ✓</Text>
                </View>
              </View>
              <View style={styles.modeRow}>
                <View>
                  <Text style={styles.rowText}>压力改善模式</Text>
                  <Text style={styles.rowHint}>
                    开启后，每天散步结束都会问问你的心情
                  </Text>
                </View>
                <Switch
                  value={calmMode}
                  onValueChange={setCalmMode}
                  trackColor={{ false: colors.line, true: "#7EC67E" }}
                />
              </View>
              <View style={styles.group}>
                {["消息通知", "隐私", "关于 Color Catch"].map((label) => (
                  <Pressable key={label} style={styles.row}>
                    <Text style={styles.rowText}>{label}</Text>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.row} onPress={logout}>
                  <Text style={[styles.rowText, styles.logout]}>退出登录</Text>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              </View>
              <Text style={styles.version}>Color Catch · 原型 v0.4</Text>
            </Pressable>
          </Pressable>
        </Modal>
        <Modal
          visible={animal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setAnimal(null)}
        >
          <Pressable style={styles.maskCenter} onPress={() => setAnimal(null)}>
            {animal ? (
              <Pressable style={styles.animalModal} onPress={(event) => event.stopPropagation()}>
                {getAnimalAsset(animal[0]) ? (
                  <Image
                    source={getAnimalAsset(animal[0])}
                    style={styles.modalAnimalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.modalAnimal}>{animal[2]}</Text>
                )}
                <Text style={styles.modalTitle}>{animal[1]}</Text>
                <Text style={styles.modalCopy}>
                  {animal[3]
                    ? "已经成为你的色彩伙伴，一起去散步吧。"
                    : "收集对应颜色后，就能遇见这位伙伴。"}
                </Text>
                <Pressable
                  style={styles.modalButton}
                  onPress={() => setAnimal(null)}
                >
                  <Text style={styles.modalButtonText}>
                    {animal[3] ? "一起散步 🐾" : "去收集对应颜色"}
                  </Text>
                </Pressable>
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingTop: 8, paddingBottom: 96, gap: 28 },
  settingsRow: { height: 28, alignItems: "flex-end" },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { color: "#B4A88E", fontSize: 21 },
  profile: { marginTop: -10, alignItems: "center" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B2CCE2",
    overflow: "hidden",
  },
  avatarImage: { width: 74, height: 74 },
  avatarText: { fontSize: 31 },
  name: { marginTop: 14, color: colors.ink, fontSize: 18, fontWeight: "700" },
  level: {
    marginTop: 4,
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
  },
  wallet: {
    marginTop: 11,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.surfaceStrong,
  },
  walletText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  stats: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center" },
  statBorder: { borderLeftWidth: 1, borderLeftColor: "rgba(0,0,0,0.1)" },
  statValue: { color: colors.ink, fontSize: 24, fontWeight: "700" },
  statLabel: {
    marginTop: 6,
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  calmCard: { marginTop: 0, backgroundColor: "#E8F0F8" },
  calmTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  moodRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mood: {
    width: "18%",
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 16,
  },
  moodSelected: { backgroundColor: "rgba(255,255,255,0.8)" },
  moodEmoji: { fontSize: 21 },
  moodLabel: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 8,
    textAlign: "center",
  },
  moodMessage: {
    marginTop: 10,
    padding: 9,
    borderRadius: 10,
    color: colors.ink,
    textAlign: "center",
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  tealTitle: { marginBottom: -15, color: "#5CA99B" },
  pinkTitle: { color: "#D88CA1" },
  palette: { flexDirection: "row", flexWrap: "wrap", rowGap: 12 },
  paletteItem: { width: "16.666%", alignItems: "center", gap: 4 },
  paletteDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  paletteName: { color: colors.inkMuted, fontSize: 8, fontWeight: "500" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: -12,
  },
  count: { color: colors.inkMuted, fontSize: 11 },
  animals: { flexDirection: "row", flexWrap: "wrap", rowGap: 22 },
  animalItem: { width: "25%", alignItems: "center" },
  animalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  animalLocked: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D6CCB2",
  },
  animalImage: { width: 58, height: 58 },
  animalEmoji: { fontSize: 28 },
  animalEmojiLocked: { opacity: 0.25 },
  animalName: {
    marginTop: 7,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "600",
  },
  animalNameLocked: { color: "#C2BDA9" },
  animalHint: {
    marginTop: -14,
    color: "#B4A88E",
    textAlign: "center",
    fontSize: 10,
  },
  mask: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(59,59,62,0.3)",
  },
  drawer: {
    minHeight: "64%",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.paper,
  },
  handle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  drawerTitle: {
    marginTop: 14,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  group: {
    marginTop: 16,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.62)",
  },
  row: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  rowText: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  rowValue: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  nicknameInput: {
    minWidth: 110,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  bound: { color: colors.success },
  modeRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowHint: {
    marginTop: 3,
    maxWidth: 235,
    color: colors.inkMuted,
    fontSize: 10,
  },
  arrow: { color: colors.inkMuted, fontSize: 20 },
  logout: { color: colors.danger },
  version: {
    marginTop: 20,
    color: "#B4A88E",
    textAlign: "center",
    fontSize: 10,
  },
  maskCenter: {
    flex: 1,
    justifyContent: "center",
    padding: 36,
    backgroundColor: "rgba(59,59,62,0.3)",
  },
  animalModal: {
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  modalAnimal: { fontSize: 54 },
  modalAnimalImage: { width: 120, height: 120 },
  modalTitle: {
    marginTop: 12,
    color: colors.ink,
    fontSize: 19,
    fontWeight: "700",
  },
  modalCopy: {
    marginTop: 10,
    color: colors.inkMuted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
  },
  modalButton: {
    alignSelf: "stretch",
    height: 46,
    marginTop: 20,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  modalButtonText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
