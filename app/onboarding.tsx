import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useEscola } from "@/lib/escola-context";
import { ONBOARDING_SLIDES } from "@/lib/types";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, cores } = useEscola();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await handleComplete();
  };

  const handleComplete = async () => {
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
  };

  const renderSlide = ({ item, index }: { item: typeof ONBOARDING_SLIDES[0]; index: number }) => {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ width }}
      >
        {/* Ícone Grande */}
        <View
          className="w-40 h-40 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: `${item.cor}20` }}
        >
          <Text className="text-7xl">{item.icone}</Text>
        </View>

        {/* Título */}
        <Text
          className="text-3xl font-bold text-center mb-4"
          style={{ color: item.cor }}
        >
          {item.titulo}
        </Text>

        {/* Descrição */}
        <Text className="text-lg text-muted text-center leading-7 px-4">
          {item.descricao}
        </Text>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 bg-background">
        {/* Header com botão Pular */}
        <View className="flex-row justify-end p-4">
          {!isLastSlide && (
            <TouchableOpacity
              onPress={handleSkip}
              className="px-4 py-2"
            >
              <Text className="text-muted text-lg">Pular</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_SLIDES}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            scrollEventThrottle={16}
            bounces={false}
          />
        </View>

        {/* Indicadores de Página */}
        <View className="flex-row justify-center items-center py-6 gap-2">
          {ONBOARDING_SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              className={`rounded-full ${
                index === currentIndex ? "w-8 h-3" : "w-3 h-3"
              }`}
              style={{
                backgroundColor:
                  index === currentIndex
                    ? slide.cor
                    : "#E5E7EB",
              }}
            />
          ))}
        </View>

        {/* Botões de Navegação */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={handleNext}
            className="py-5 rounded-2xl items-center"
            style={{ backgroundColor: ONBOARDING_SLIDES[currentIndex].cor }}
          >
            <Text className="text-white text-xl font-bold">
              {isLastSlide ? "Começar a Usar" : "Próximo"}
            </Text>
          </TouchableOpacity>

          {isLastSlide && (
            <TouchableOpacity
              onPress={() => router.push("/configuracoes")}
              className="mt-4 py-4 rounded-2xl items-center bg-surface border border-border"
            >
              <Text className="text-foreground text-lg font-semibold">
                Configurar Minha Escola Primeiro
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
