import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface PasswordInputProps extends Omit<TextInputProps, "secureTextEntry"> {
  value: string;
  onChangeText: (text: string) => void;
}

export function PasswordInput({ value, onChangeText, style, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name={visible ? "eye-off" : "eye"} size={18} color={colors.ink[400]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 44,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink[900],
    backgroundColor: colors.white,
  },
  toggle: {
    position: "absolute",
    right: 14,
  },
});
