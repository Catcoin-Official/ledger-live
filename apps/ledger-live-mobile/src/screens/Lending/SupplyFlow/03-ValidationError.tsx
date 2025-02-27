import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import ValidateError from "../../../components/ValidateError";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { LendingSupplyFlowNavigatorParamList } from "../../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { ScreenName } from "../../../const";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<
    LendingSupplyFlowNavigatorParamList,
    ScreenName.LendingSupplyValidationError
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationError({
  navigation,
  route,
}: NavigationProps) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const { currency, error } = route.params;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="Lend Supply"
        name="Error"
        eventProperties={{
          currencyName: currency?.name,
        }}
      />
      <ValidateError error={error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
