import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Color Walk startup error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.page}>
        <Text style={styles.title}>Color Walk 没有正常启动</Text>
        <Text style={styles.message}>关闭 Expo Go 后重新扫码，并使用清缓存模式重新启动。</Text>
        <Text selectable style={styles.detail}>{this.state.error.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: colors.paper, gap: 12 },
  title: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  message: { color: colors.inkMuted, lineHeight: 21 },
  detail: { color: colors.danger, fontSize: 12, lineHeight: 18 },
});
