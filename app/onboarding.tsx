import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useEscola } from "@/lib/escola-context";
import { ONBOARDING_SLIDES } from "@/lib/types";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useEscola();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  }, [currentIndex]);

  const handleSkip = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await handleComplete();
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      await completeOnboarding();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
      router.replace("/(tabs)");
    }
  }, [completeOnboarding, router]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setCurrentIndex(index);
    }
  }, [currentIndex]);

  const goToSlide = useCallback((index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
  }, []);

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;
  const currentSlide = ONBOARDING_SLIDES[currentIndex];

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 bg-background">
        {/* Header com botão Pular */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-4 py-2"
          >
            <Text className="text-muted text-lg">← Voltar</Text>
          </TouchableOpacity>
          
          {!isLastSlide && (
            <TouchableOpacity
              onPress={handleSkip}
              className="px-4 py-2"
            >
              <Text className="text-muted text-lg font-medium">Pular</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
          className="flex-1"
        >
          {ONBOARDING_SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              className="flex-1 items-center justify-center px-8"
              style={{ width: SCREEN_WIDTH }}
            >
              {/* Ícone Grande */}
              <View
                className="w-36 h-36 rounded-full items-center justify-center mb-8"
                style={{ backgroundColor: `${slide.cor}20` }}
              >
                <Text style={{ fontSize: 64 }}>{slide.icone}</Text>
              </View>

              {/* Título */}
              <Text
                className="text-2xl font-bold text-center mb-4 px-4"
                style={{ color: slide.cor }}
              >
                {slide.titulo}
              </Text>

              {/* Descrição */}
              <Text className="text-base text-muted text-center leading-7 px-6">
                {slide.descricao}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Indicadores de Página */}
        <View className="flex-row justify-center items-center py-6 gap-3">
          {ONBOARDING_SLIDES.map((slide, index) => (
            <TouchableOpacity
              key={slide.id}
              onPress={() => goToSlide(index)}
              className={`rounded-full ${
                index === currentIndex ? "w-10 h-3" : "w-3 h-3"
              }`}
              style={{
                backgroundColor:
                  index === currentIndex
                    ? currentSlide.cor
                    : "#D1D5DB",
              }}
            />
          ))}
        </View>

        {/* Contador de Slides */}
        <View className="items-center pb-2">
          <Text className="text-muted text-base">
            {currentIndex + 1} de {ONBOARDING_SLIDES.length}
          </Text>
        </View>

        {/* Botões de Navegação */}
        <View className="px-6 pb-8 gap-3">
          <TouchableOpacity
            onPress={handleNext}
            className="py-5 rounded-2xl items-center"
            style={{ backgroundColor: currentSlide.cor }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-xl font-bold">
              {isLastSlide ? "🎉 Começar a Usar" : "Próximo →"}
            </Text>
          </TouchableOpacity>

          {isLastSlide && (
            <TouchableOpacity
              onPress={() => router.push("/configuracoes")}
              className="py-4 rounded-2xl items-center bg-surface border-2 border-border"
              activeOpacity={0.8}
            >
              <Text className="text-foreground text-lg font-semibold">
                ⚙️ Configurar Minha Escola Primeiro
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
