import React, { useRef, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface OtpInputProps {
  code: string[];
  setCode: (code: string[]) => void;
  autoFocus?: boolean;
}

export function OtpInput({ code, setCode, autoFocus = true }: OtpInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.container}>
      {code.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          style={[styles.input, digit ? styles.inputFilled : undefined]}
          value={digit}
          onChangeText={(v) => handleChange(i, v)}
          onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  input: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: colors.ink[900],
  },
  inputFilled: {
    borderColor: colors.brand[400],
  },
});
