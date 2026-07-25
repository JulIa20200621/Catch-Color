import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { getOptionalLocation, savePhotoToDevice } from '../services/device';
import { persistImageUri } from '../services/imagePersistence';
import { uploadCapturedPhoto } from '../services/supabaseData';
import { analyzeLocalPhoto } from '../services/photoAnalysis';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import type { PhotoRecord, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [webCameraRequested, setWebCameraRequested] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const dailyTarget = useAppStore((state) => state.dailyTarget);
  const isAnalyzing = useAppStore((state) => state.isAnalyzing);
  const setAnalyzing = useAppStore((state) => state.setAnalyzing);
  const addPhoto = useAppStore((state) => state.addPhoto);
  const account = useAppStore((state) => state.account);

  const processPhoto = async (imageUri: string, source: PhotoRecord['source']) => {
    if (!dailyTarget || isAnalyzing) return;
    setPreviewUri(imageUri);
    setAnalyzing(true);
    try {
      const [analysis, location] = await Promise.all([
        analyzeLocalPhoto(imageUri, dailyTarget.targetCategory),
        getOptionalLocation(),
      ]);

      if (source === 'camera') await savePhotoToDevice(imageUri);

      const persistedImageUri = await persistImageUri(imageUri);
      const photo: PhotoRecord = {
        id: `photo-${Date.now()}`,
        imageUri: persistedImageUri,
        createdAt: new Date().toISOString(),
        source,
        location,
        target: dailyTarget,
        analysis,
        analysisMode: 'local',
        storageType: 'local',
      };
      if (!account?.id) throw new Error('登录状态失效，请重新登录后再拍摄。');
      const syncedPhoto = await uploadCapturedPhoto(account.id, photo);
      addPhoto(syncedPhoto);
      navigation.replace('Result', { photoId: syncedPhoto.id });
    } catch (error) {
      Alert.alert('分析失败', error instanceof Error ? error.message : '请稍后再试');
    } finally {
      setAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.75 });
      if (photo?.uri) await processPhoto(photo.uri, 'camera');
    } catch {
      Alert.alert('拍摄失败', '相机暂时不可用，请尝试从相册选择。');
    }
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processPhoto(result.assets[0].uri, 'library');
    }
  };

  const requestWebCamera = async () => {
    const result = await requestPermission();
    if (result.granted) setWebCameraRequested(true);
  };

  if (Platform.OS === 'web' && (!webCameraRequested || !permission?.granted || cameraError)) {
    return (
      <View style={styles.permissionPage}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={34} color={colors.coral} />
        </View>
        <Text style={styles.permissionTitle}>在电脑上捕捉今日颜色</Text>
        <Text style={styles.permissionText}>
          开启摄像头后可以用电脑摄像头拍摄。如果浏览器没有摄像头、不支持或被拒绝权限，请选择本地图片继续完成分析。
        </Text>
        <PrimaryButton label="开启电脑摄像头" icon="camera" onPress={() => void requestWebCamera()} />
        <PrimaryButton label="选择本地图片" icon="images-outline" variant="secondary" onPress={() => void choosePhoto()} />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.permissionPage}>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }

  if (!permission.granted || cameraError) {
    return (
      <View style={styles.permissionPage}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={34} color={colors.coral} />
        </View>
        <Text style={styles.permissionTitle}>
          {cameraError ? '当前浏览器无法启动相机' : '需要相机权限'}
        </Text>
        <Text style={styles.permissionText}>
          {Platform.OS === 'web'
            ? '你仍可以选择一张照片，完成整个颜色分析演示。'
            : '允许相机权限后才能捕捉今日颜色；定位权限可以拒绝，不会阻断拍摄。'}
        </Text>
        {!permission.granted && !cameraError ? (
          <PrimaryButton label="允许相机" icon="camera" onPress={() => void requestPermission()} />
        ) : null}
        <PrimaryButton
          label="从相册选择"
          icon="images-outline"
          variant="secondary"
          onPress={() => void choosePhoto()}
        />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={torch}
        onMountError={() => setCameraError(true)}
      >
        <View style={styles.topOverlay}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.targetPill}>
            <View
              style={[styles.targetDot, { backgroundColor: dailyTarget?.colorHex ?? colors.coral }]}
            />
            <Text style={styles.targetText}>{dailyTarget?.colorName ?? '今日颜色'}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setTorch((value) => !value)}>
            <Ionicons name={torch ? 'flash' : 'flash-off'} size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.smallControl} onPress={() => void choosePhoto()}>
            <Ionicons name="images-outline" size={23} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityLabel="拍照"
            disabled={isAnalyzing}
            style={styles.shutterOuter}
            onPress={() => void takePhoto()}
          >
            <View style={[styles.shutterInner, { backgroundColor: dailyTarget?.colorHex ?? colors.coral }]} />
          </Pressable>
          <Pressable
            style={styles.smallControl}
            onPress={() => setFacing((value) => (value === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={25} color={colors.ink} />
          </Pressable>
        </View>
      </CameraView>

      {isAnalyzing ? (
        <View style={styles.processing}>
          <View style={styles.polaroid}>
            {previewUri ? <Image source={{ uri: previewUri }} style={styles.polaroidImage} /> : null}
            <ActivityIndicator color={colors.coral} size="large" />
            <Text style={styles.processingTitle}>冲洗相纸中</Text>
            <Text style={styles.processingText}>正在读取照片像素与位置...</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1, justifyContent: 'space-between' },
  topOverlay: {
    paddingTop: Platform.OS === 'ios' ? 58 : 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253,251,242,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(253,251,242,0.9)',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    maxWidth: '60%',
  },
  targetDot: { width: 12, height: 12, borderRadius: 6 },
  targetText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  frame: { ...StyleSheet.absoluteFill, margin: 58 },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: colors.white },
  topLeft: { top: 70, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 70, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 110, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 110, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 45 : 28,
    paddingHorizontal: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(248,248,240,0.82)',
    paddingTop: 22,
  },
  smallControl: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30 },
  permissionPage: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8DDD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  permissionText: {
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 420,
    marginBottom: 10,
  },
  processing: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20,18,15,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  polaroid: {
    width: '100%',
    maxWidth: 320,
    minHeight: 360,
    backgroundColor: colors.surface,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    transform: [{ rotate: '-2deg' }],
  },
  polaroidImage: { width: '100%', aspectRatio: 1, backgroundColor: colors.line },
  processingTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  processingText: { color: colors.inkMuted, textAlign: 'center' },
});
