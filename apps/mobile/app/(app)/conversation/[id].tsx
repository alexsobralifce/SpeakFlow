import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Note: assuming nativewind is configured, we use className
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence
} from 'react-native-reanimated';

// Mock types/interfaces inline for the example
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi there! Welcome to the coffee shop. What would you like to order today?' }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Avatar pulsing animation
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (isAITalking) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isAITalking]);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate AI thinking and replying
      setIsAILoading(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: 'I would like a cappuccino, please.' }]);
      setTimeout(() => {
        setIsAILoading(false);
        setIsAITalking(true);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Great choice! One cappuccino coming right up. Anything else?' }]);
        setTimeout(() => setIsAITalking(false), 3000);
      }, 1500);
    } else {
      setIsRecording(true);
      setErrorMsg(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between py-4 border-b border-neutral-100">
        <TouchableOpacity accessibilityLabel="Go back">
          <Text className="text-neutral-600 text-lg">←</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Animated.View style={avatarAnimatedStyle} className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center mb-1">
            <Text className="text-white font-bold">AI</Text>
          </Animated.View>
          <Text className="font-display font-medium text-neutral-900">Coffee Shop</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Options">
          <Text className="text-neutral-600 text-lg">⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Error Toast */}
      {errorMsg && (
        <Animated.View className="absolute top-24 left-4 right-4 bg-semantic-error z-50 p-3 rounded-lg shadow-sm">
          <Text className="text-white text-center font-medium">{errorMsg}</Text>
        </Animated.View>
      )}

      {/* Chat Area */}
      <ScrollView
        className="flex-1 py-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`mb-4 max-w-[85%] ${msg.role === 'assistant' ? 'self-start' : 'self-end'}`}
            accessibilityLabel={`${msg.role} message`}
          >
            <View className={`p-4 rounded-2xl ${msg.role === 'assistant'
                ? 'bg-white rounded-tl-sm border border-neutral-100'
                : 'bg-primary-500 rounded-tr-sm'
              }`}>
              <Text className={msg.role === 'assistant' ? 'text-neutral-900' : 'text-white'}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {isAILoading && (
          <View className="self-start bg-white p-4 rounded-2xl rounded-tl-sm border border-neutral-100 max-w-[85%] mb-4">
            <ActivityIndicator color="#6C63FF" />
          </View>
        )}
      </ScrollView>

      {/* Bottom Target / Recording Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-6 pt-4 pb-8 flex-row items-center justify-between"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <TouchableOpacity accessibilityLabel="Pause session" className="p-3">
          <Text className="text-neutral-400 font-bold">⏸</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center -mt-8">
          <TouchableOpacity
            onPress={toggleRecording}
            accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
            className={`w-20 h-20 rounded-full items-center justify-center shadow-md ${isRecording ? 'bg-semantic-error' : 'bg-primary-500'
              }`}
          >
            <Text className="text-white text-3xl">{isRecording ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>
          {isRecording && (
            <Text className="text-semantic-error font-medium mt-2 animate-pulse">Recording... 00:03</Text>
          )}
        </View>

        <TouchableOpacity accessibilityLabel="Keyboard input" className="p-3">
          <Text className="text-neutral-400 font-bold">⌨️</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
