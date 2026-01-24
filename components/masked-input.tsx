/**
 * Componente de entrada com máscara, validação e dicas visuais
 * Suporta: telefone, data, horário, email, CPF, CEP
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

// Tipos de máscara suportados
export type MaskType = "telefone" | "data" | "horario" | "email" | "cpf" | "cep" | "texto";

interface MaskedInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maskType: MaskType;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  editable?: boolean;
}

// Funções de máscara
const masks = {
  telefone: (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  },
  
  data: (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  },
  
  horario: (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  },
  
  cpf: (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  },
  
  cep: (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  },
  
  email: (value: string): string => value.toLowerCase().trim(),
  
  texto: (value: string): string => value,
};

// Funções de validação
const validators = {
  telefone: (value: string): boolean => {
    const numbers = value.replace(/\D/g, "");
    return numbers.length >= 10 && numbers.length <= 11;
  },
  
  data: (value: string): boolean => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length !== 8) return false;
    const day = parseInt(numbers.slice(0, 2));
    const month = parseInt(numbers.slice(2, 4));
    const year = parseInt(numbers.slice(4, 8));
    return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
  },
  
  horario: (value: string): boolean => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length !== 4) return false;
    const hour = parseInt(numbers.slice(0, 2));
    const minute = parseInt(numbers.slice(2, 4));
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  },
  
  cpf: (value: string): boolean => {
    const numbers = value.replace(/\D/g, "");
    return numbers.length === 11;
  },
  
  cep: (value: string): boolean => {
    const numbers = value.replace(/\D/g, "");
    return numbers.length === 8;
  },
  
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  texto: (): boolean => true,
};

// Configurações por tipo
const configs: Record<MaskType, { 
  maxLength: number; 
  keyboardType: "default" | "numeric" | "email-address" | "phone-pad";
  placeholder: string;
  helpText: string;
}> = {
  telefone: {
    maxLength: 15,
    keyboardType: "phone-pad",
    placeholder: "(00) 00000-0000",
    helpText: "Digite o número com DDD. Ex: (11) 99999-9999",
  },
  data: {
    maxLength: 10,
    keyboardType: "numeric",
    placeholder: "DD/MM/AAAA",
    helpText: "Digite a data no formato dia/mês/ano. Ex: 25/12/2024",
  },
  horario: {
    maxLength: 5,
    keyboardType: "numeric",
    placeholder: "HH:MM",
    helpText: "Digite o horário no formato 24h. Ex: 19:30",
  },
  cpf: {
    maxLength: 14,
    keyboardType: "numeric",
    placeholder: "000.000.000-00",
    helpText: "Digite os 11 dígitos do CPF",
  },
  cep: {
    maxLength: 9,
    keyboardType: "numeric",
    placeholder: "00000-000",
    helpText: "Digite os 8 dígitos do CEP",
  },
  email: {
    maxLength: 100,
    keyboardType: "email-address",
    placeholder: "exemplo@email.com",
    helpText: "Digite um e-mail válido. Ex: nome@escola.com.br",
  },
  texto: {
    maxLength: 200,
    keyboardType: "default",
    placeholder: "",
    helpText: "",
  },
};

export function MaskedInput({
  label,
  value,
  onChangeText,
  maskType,
  placeholder,
  maxLength,
  required = false,
  helpText,
  errorMessage,
  editable = true,
}: MaskedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [touched, setTouched] = useState(false);

  const config = configs[maskType];
  const mask = masks[maskType];
  const validate = validators[maskType];

  const isValid = !value || validate(value);
  const showError = touched && value && !isValid;
  const finalHelpText = helpText || config.helpText;
  const finalPlaceholder = placeholder || config.placeholder;
  const finalMaxLength = maxLength || config.maxLength;

  const handleChangeText = useCallback((text: string) => {
    const maskedValue = mask(text);
    onChangeText(maskedValue);
  }, [mask, onChangeText]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTouched(true);
  }, []);

  const handleHelpPress = useCallback(() => {
    setShowHelp(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <View className="mb-4">
      {/* Label com indicador de obrigatório e botão de ajuda */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1">
          <Text className="text-foreground text-base font-semibold">
            {label}
          </Text>
          {required && (
            <Text className="text-error text-lg">*</Text>
          )}
        </View>
        
        {finalHelpText && (
          <TouchableOpacity
            onPress={handleHelpPress}
            className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-base font-bold">?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Campo de entrada */}
      <View
        className={`flex-row items-center rounded-xl border-2 px-4 py-3 ${
          !editable ? "bg-muted/20" : "bg-background"
        } ${
          showError
            ? "border-error"
            : isFocused
            ? "border-primary"
            : "border-border"
        }`}
      >
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={finalPlaceholder}
          placeholderTextColor="#9BA1A6"
          keyboardType={config.keyboardType}
          maxLength={finalMaxLength}
          editable={editable}
          autoCapitalize={maskType === "email" ? "none" : "sentences"}
          autoCorrect={false}
          className="flex-1 text-foreground text-lg"
          style={{ minHeight: 24 }}
        />
        
        {/* Indicador de validação */}
        {touched && value && (
          <View className="ml-2">
            {isValid ? (
              <Text className="text-success text-xl">✓</Text>
            ) : (
              <Text className="text-error text-xl">✗</Text>
            )}
          </View>
        )}
      </View>

      {/* Contador de caracteres */}
      {maskType === "texto" && finalMaxLength && (
        <Text className="text-muted text-sm mt-1 text-right">
          {value.length}/{finalMaxLength}
        </Text>
      )}

      {/* Mensagem de erro */}
      {showError && (
        <View className="flex-row items-center gap-1 mt-2">
          <Text className="text-error text-lg">⚠️</Text>
          <Text className="text-error text-sm">
            {errorMessage || `${label} inválido(a). Verifique o formato.`}
          </Text>
        </View>
      )}

      {/* Modal de ajuda */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 items-center justify-center p-6"
          activeOpacity={1}
          onPress={() => setShowHelp(false)}
        >
          <View className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-border">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-xl font-bold">?</Text>
              </View>
              <Text className="text-foreground text-xl font-bold flex-1">
                {label}
              </Text>
            </View>
            
            <Text className="text-foreground text-base leading-6 mb-4">
              {finalHelpText}
            </Text>
            
            <View className="bg-background rounded-xl p-3 mb-4">
              <Text className="text-muted text-sm mb-1">Formato esperado:</Text>
              <Text className="text-foreground text-lg font-mono">
                {finalPlaceholder}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setShowHelp(false)}
              className="bg-primary rounded-xl py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-bold">Entendi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Componente de entrada de texto simples com contador
export function TextInputWithCounter({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength = 200,
  required = false,
  helpText,
  multiline = false,
  numberOfLines = 1,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  helpText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <View className="mb-4">
      {/* Label */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1">
          <Text className="text-foreground text-base font-semibold">
            {label}
          </Text>
          {required && (
            <Text className="text-error text-lg">*</Text>
          )}
        </View>
        
        {helpText && (
          <TouchableOpacity
            onPress={() => setShowHelp(true)}
            className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-base font-bold">?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Campo */}
      <View
        className={`rounded-xl border-2 px-4 py-3 ${
          !editable ? "bg-muted/20" : "bg-background"
        } ${isFocused ? "border-primary" : "border-border"}`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#9BA1A6"
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          className="text-foreground text-lg"
          style={{ 
            minHeight: multiline ? numberOfLines * 24 : 24,
            textAlignVertical: multiline ? "top" : "center",
          }}
        />
      </View>

      {/* Contador */}
      <Text className="text-muted text-sm mt-1 text-right">
        {value.length}/{maxLength}
      </Text>

      {/* Modal de ajuda */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 items-center justify-center p-6"
          activeOpacity={1}
          onPress={() => setShowHelp(false)}
        >
          <View className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-border">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-xl font-bold">?</Text>
              </View>
              <Text className="text-foreground text-xl font-bold flex-1">
                {label}
              </Text>
            </View>
            
            <Text className="text-foreground text-base leading-6 mb-4">
              {helpText}
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowHelp(false)}
              className="bg-primary rounded-xl py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-bold">Entendi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
