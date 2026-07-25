import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraCapturedPicture, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { getOptionalLocation, savePhotoToDevice } from '../services/device';
import { persistImageUri } from '../services/imagePersistence';
import { uploadCapturedPhoto } from '../services/supabaseData';
import { analyzeLocalPhoto } from '../services/photoAnalysis';
import { createFallbackDailyTarget } from '../data/palette';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import type { PhotoRecord, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ navigation, route }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const nativePermissionRequested = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>(route.params?.initialFacing ?? 'back');
  const [torch, setTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [webCameraRequested, setWebCameraRequested] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'uploading' | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<PhotoRecord | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const dailyTarget = useAppStore((state) => state.dailyTarget);
  const setDailyTarget = useAppStore((state) => state.setDailyTarget);
  const isAnalyzing = useAppStore((state) => state.isAnalyzing);
  const setAnalyzing = useAppStore((state) => state.setAnalyzing);
  const addPhoto = useAppStore((state) => state.addPhoto);
  const account = useAppStore((state) => state.account);
  const target = dailyTarget ?? createFallbackDailyTarget();

  const getLocationWithoutBlocking = async () => Promise.race([
    getOptionalLocation(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4_000)),
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web' && !nativePermissionRequested.current && permission && !permission.granted && permission.canAskAgain) {
      nativePermissionRequested.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const errorMessage = (error: unknown) => error instanceof Error ? error.message : '未知错误，请稍后重试。';

  const saveToCloud = async (photo: PhotoRecord): Promise<boolean> => {
    if (!account?.id) {
      setCaptureError('登录状态已失效，请重新登录后再保存照片。');
      return false;
    }

    setProcessingStage('uploading');
    try {
      const syncedPhoto = await uploadCapturedPhoto(account.id, photo);
      setPendingPhoto(null);
      addPhoto(syncedPhoto);
      navigation.replace('Result', { photoId: syncedPhoto.id });
      return true;
    } catch (error) {
      setCaptureError(`颜色已识别，但照片尚未保存到云端。\n\n${errorMessage(error)}`);
      return false;
    } finally {
      setProcessingStage(null);
    }
  };

  const retryCloudSave = async () => {
    if (!pendingPhoto || isAnalyzing) return;
    setCaptureError(null);
    setAnalyzing(true);
    await saveToCloud(pendingPhoto);
    setAnalyzing(false);
  };

  const processPhoto = async (imageUri: string, source: PhotoRecord['source']) => {
    if (isAnalyzing) return;
    if (!dailyTarget) setDailyTarget(target);
    setPreviewUri(imageUri);
    setCaptureError(null);
    setPendingPhoto(null);
    setAnalyzing(true);
    setProcessingStage('analyzing');
    try {
      const analysis = await analyzeLocalPhoto(imageUri, target.targetCategory);
      const location = await getLocationWithoutBlocking();

      if (source === 'camera') await savePhotoToDevice(imageUri);

      const persistedImageUri = await persistImageUri(imageUri);
      const photo: PhotoRecord = {
        id: `photo-${Date.now()}`,
        imageUri: persistedImageUri,
        createdAt: new Date().toISOString(),
        source,
        location,
        target,
        analysis,
        analysisMode: 'local',
        storageType: 'local',
      };
      setPendingPhoto(photo);
      await saveToCloud(photo);
    } catch (error) {
      setCaptureError(`无法完成颜色识别。\n\n${errorMessage(error)}`);
    } finally {
      setProcessingStage(null);
      setAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('相机还在准备', '请等待预览稳定后再按一次快门。');
      return;
    }
    try {
      let photo: CameraCapturedPicture | undefined;
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          photo = await cameraRef.current.takePictureAsync({ quality: 0.75 });
          break;
        } catch (error) {
          lastError = error;
          const isWebReadinessRace = Platform.OS === 'web'
            && error instanceof Error
            && /not ready|enough camera data|mediastream/i.test(error.message);
          if (!isWebReadinessRace || attempt === 2) throw error;
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      if (!photo?.uri) throw lastError instanceof Error ? lastError : new Error('没能获取到当前相机画面。');
      await processPhoto(photo.uri, 'camera');
    } catch (error) {
      Alert.alert('拍摄失败', error instanceof Error ? error.message : '相机暂时不可用，请尝试从相册选择。');
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

  const requestCameraAccess = async () => {
    setCameraError(null);
    const result = await requestPermission();
    if (result.granted) {
      setWebCameraRequested(true);
      setCameraAttempt((value) => value + 1);
      return;
    }
    if (!result.canAskAgain && Platform.OS !== 'web') {
      Alert.alert('摄像头权限已被拒绝', '请在系统设置中允许 Color Walk 访问摄像头。', [
        { text: '取消', style: 'cancel' },
        { text: '打开设置', onPress: () => void Linking.openSettings() },
      ]);
    }
  };

  const switchCamera = () => {
    setTorch(false);
    setFacing((value) => (value === 'back' ? 'front' : 'back'));
    setCameraAttempt((value) => value + 1);
  };

  if (Platform.OS === 'web' && (!webCameraRequested || !permission?.granted || cameraError)) {
    return (
      <View style={styles.permissionPage}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={34} color={colors.coral} />
        </View>
        <Text style={styles.permissionTitle}>{cameraError ? '摄像头启动失败' : '在电脑上捕捉今日颜色'}</Text>
        <Text style={styles.permissionText}>
          {cameraError ?? '开启摄像头后可以用电脑摄像头拍摄。如果浏览器没有摄像头、不支持或被拒绝权限，请选择本地图片继续完成分析。'}
        </Text>
        <PrimaryButton label={cameraError ? '重试开启摄像头' : '开启电脑摄像头'} icon="camera" onPress={() => void requestCameraAccess()} />
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
          {cameraError ? '相机无法启动' : '需要相机权限'}
        </Text>
        <Text style={styles.permissionText}>
          {Platform.OS === 'web'
            ? '你仍可以选择一张照片，完成整个颜色分析演示。'
            : '允许相机权限后才能捕捉今日颜色；定位权限可以拒绝，不会阻断拍摄。'}
        </Text>
        {!permission.granted ? (
          <PrimaryButton label={permission.canAskAgain ? '允许相机' : '打开系统设置'} icon="camera" onPress={() => void requestCameraAccess()} />
        ) : null}
        {cameraError ? <PrimaryButton label="重试开启相机" icon="refresh" onPress={() => { setCameraError(null); setCameraAttempt((value) => value + 1); }} /> : null}
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
        key={`camera-${facing}-${cameraAttempt}`}
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={torch}
        onMountError={(event) => {
          setCameraError(event.message || '设备没有可用的摄像头。');
        }}
      >
        <View style={styles.topOverlay}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.targetPill}>
            <View
              style={[styles.targetDot, { backgroundColor: target.colorHex }]}
            />
            <Text style={styles.targetText}>{target.colorName}</Text>
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
            style={[styles.shutterOuter, isAnalyzing && styles.shutterDisabled]}
            onPress={() => void takePhoto()}
          >
            <View style={[styles.shutterInner, { backgroundColor: target.colorHex }]} />
          </Pressable>
          <Pressable accessibilityLabel="切换前后摄像头" style={styles.switchControl} onPress={switchCamera}>
            <Ionicons name="camera-reverse-outline" size={25} color={colors.ink} />
            <Text style={styles.switchText}>{facing === 'back' ? '后置' : '前置'}</Text>
          </Pressable>
        </View>
      </CameraView>

      {captureError ? (
        <View style={styles.captureErrorPanel}>
          <Text style={styles.captureErrorTitle}>照片尚未保存到云端</Text>
          {pendingPhoto ? (
            <Text style={styles.captureErrorAnalysis}>
              颜色识别已完成：目标颜色占比 {Math.round(pendingPhoto.analysis.targetRatio * 100)}%
            </Text>
          ) : null}
          <Text selectable style={styles.captureErrorText}>{captureError}</Text>
          {pendingPhoto ? (
            <Pressable style={styles.retryButton} onPress={() => void retryCloudSave()}>
              <Text style={styles.retryButtonText}>重试云端保存</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.dismissErrorButton} onPress={() => setCaptureError(null)}>
            <Text style={styles.dismissErrorText}>关闭</Text>
          </Pressable>
        </View>
      ) : null}

      {isAnalyzing ? (
        <View style={styles.processing}>
          <View style={styles.polaroid}>
            {previewUri ? <Image source={{ uri: previewUri }} style={styles.polaroidImage} /> : null}
            <ActivityIndicator color={colors.coral} size="large" />
            <Text style={styles.processingTitle}>
              {processingStage === 'uploading' ? '正在保存到云端' : '正在识别颜色'}
            </Text>
            <Text style={styles.processingText}>
              {processingStage === 'uploading'
                ? '照片和识别结果将同步到你的云端相册'
                : '正在读取照片像素和颜色分布'}
            </Text>
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
  switchControl: { minWidth: 70, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  switchText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.5 },
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
  captureErrorPanel: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  captureErrorTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  captureErrorAnalysis: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  captureErrorText: { color: colors.inkMuted, fontSize: 13, lineHeight: 19 },
  retryButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coral,
    paddingHorizontal: 16,
  },
  retryButtonText: { color: colors.surface, fontWeight: '900' },
  dismissErrorButton: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  dismissErrorText: { color: colors.inkMuted, fontWeight: '700' },
});
