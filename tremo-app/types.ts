import { TextInput, TextInputProps, TextStyle, TouchableOpacityProps, ViewStyle } from "react-native"

export type ScreenWrapperProps = {
    style?: ViewStyle;
    children: React.ReactNode;
}

export type BackButtonProps = {
    style?: ViewStyle;
    iconSize?: number;
}

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  //   label?: string;
  //   error?: string;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}