import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function FeedbackScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="px-6 py-4 border-b border-neutral-100 bg-white">
        <Text className="font-display font-bold text-2xl text-neutral-900 text-center">Session Feedback</Text>
        <Text className="text-center text-neutral-500 mt-1">Coffee Shop Scenario</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>

        {/* Score Cards */}
        <View className="flex-row justify-between mb-8">
          <ScoreBox title="Fluency" score={85} color="bg-secondary-500" icon="🗣️" />
          <ScoreBox title="Vocabulary" score={72} color="bg-primary-500" icon="📚" />
          <ScoreBox title="Grammar" score={90} color="bg-semantic-info" icon="✍️" />
        </View>

        {/* Corrections List */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="font-display font-bold text-lg text-neutral-900 mr-2">Corrections</Text>
            <View className="bg-semantic-error/10 px-2 py-0.5 rounded-full">
              <Text className="text-semantic-error text-xs font-bold">2</Text>
            </View>
          </View>

          {/* Correction Card 1 */}
          <View className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 mb-3">
            <View className="flex-row items-start mb-2">
              <Text className="text-semantic-error mr-2 font-bold">✕</Text>
              <Text className="text-neutral-600 line-through">I want a coffee, please</Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Text className="text-secondary-500 mr-2 font-bold">✓</Text>
              <Text className="text-neutral-900 font-medium font-body">I would like a coffee, please</Text>
            </View>
            <View className="bg-neutral-50 p-3 rounded-xl">
              <Text className="text-sm text-neutral-600">
                <Text className="font-bold">Dica:</Text> Usar "would like" soa mais educado e natural em inglês ao fazer pedidos do que "want".
              </Text>
            </View>
          </View>
        </View>

        {/* New Words */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="font-display font-bold text-lg text-neutral-900 mr-2">New Words</Text>
            <View className="bg-semantic-info/10 px-2 py-0.5 rounded-full">
              <Text className="text-semantic-info text-xs font-bold">1</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4">
            <View className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 w-64 mr-4">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="font-display font-bold text-xl text-neutral-900">Brew</Text>
                <TouchableOpacity accessibilityLabel="Save to vocabulary">
                  <Text className="text-primary-500 text-xl">🔖</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-neutral-500 text-sm mb-3">/bruː/ • verb</Text>
              <Text className="text-neutral-700 italic text-sm">"We brew fresh coffee every morning."</Text>
            </View>
          </ScrollView>
        </View>

        {/* Transcript Toggle (Simplified) */}
        <TouchableOpacity className="bg-white p-4 rounded-2xl border border-neutral-100 flex-row justify-between items-center mb-8 shadow-sm">
          <Text className="font-medium text-neutral-900">Full Transcript</Text>
          <Text className="text-neutral-400">▼</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View className="px-6 py-4 bg-white border-t border-neutral-100 pb-safe">
        <TouchableOpacity className="bg-primary-500 py-4 rounded-xl items-center shadow-sm mb-3">
          <Text className="text-white font-bold text-lg font-display">Practice Again</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-2 items-center">
          <Text className="text-neutral-600 font-medium">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ScoreBox({ title, score, color, icon }: { title: string, score: number, color: string, icon: string }) {
  return (
    <View className="bg-white p-4 rounded-2xl border border-neutral-100 items-center flex-1 mx-1 shadow-sm">
      <Text className="text-2xl mb-1">{icon}</Text>
      <View className={`${color} px-2 py-1 rounded-full mb-1`}>
        <Text className="text-white font-bold text-sm">{score}</Text>
      </View>
      <Text className="text-xs text-neutral-500 font-medium">{title}</Text>
    </View>
  );
}
