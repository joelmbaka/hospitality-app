import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Reusable full-screen loading overlay.
 *
 * Example:
 *   <LoadingOverlay visible={loading} message="Preparing checkout…" />
 */
export default function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#fff" />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    marginTop: 12,
    color: '#fff',
  },
});
