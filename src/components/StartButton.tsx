import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { RunStatus } from '../types';

interface Props {
  status: RunStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function StartButton({ status, onStart, onPause, onResume }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    if (status === 'idle' || status === 'finished') onStart();
    else if (status === 'running') onPause();
    else if (status === 'paused') onResume();
  };

  const label =
    status === 'idle' || status === 'finished'
      ? 'СТАРТ'
      : status === 'running'
      ? 'ПАУЗА'
      : 'ПРОДОЛЖИТЬ';

  const bgColor =
    status === 'running' ? '#FF6B35' : '#00E5A0';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, { backgroundColor: bgColor }]}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  label: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
