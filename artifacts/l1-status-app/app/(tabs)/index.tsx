import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { InstallBanner } from "@/components/InstallBanner";
import { SystemCard } from "@/components/EditorComponents";
import { useStatus } from "@/context/StatusContext";
import { useColors } from "@/hooks/useColors";

type Tab = "editor" | "preview";

function MetaSection() {
  const colors = useColors();
  const { state, setReportTitle, setDate, setTime, setNow } = useStatus();

  return (
    <View
      style={[
        styles.metaCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TextInput
        style={[styles.reportTitleInput, { color: colors.foreground }]}
        value={state.reportTitle}
        onChangeText={setReportTitle}
        placeholder="Report title"
        placeholderTextColor={colors.mutedForeground}
      />
      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
            DATE
          </Text>
          <TextInput
            style={[
              styles.metaInput,
              {
                color: colors.foreground,
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            value={state.date}
            onChangeText={setDate}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
            TIME
          </Text>
          <TextInput
            style={[
              styles.metaInput,
              {
                color: colors.foreground,
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            value={state.time}
            onChangeText={setTime}
            placeholder="03:00 AM"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.nowBtn,
            { backgroundColor: colors.cardSecondary, borderColor: colors.border },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setNow();
          }}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={14} color={colors.primary} />
          <Text style={[styles.nowBtnText, { color: colors.primary }]}>
            Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EditorView() {
  const colors = useColors();
  const { state, addSystem, resetTemplate } = useStatus();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom:
            insets.bottom + (Platform.OS === "web" ? 34 : 24) + 80,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={80}
    >
      <MetaSection />

      {state.systems.map((sys, si) => (
        <SystemCard key={sys.id} si={si} />
      ))}

      <TouchableOpacity
        style={[
          styles.addSystemBtn,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          addSystem();
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.addSystemBtnText}>Add System</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.resetBtn,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(
            "Reset to template?",
            "Current entries will be replaced with the standard L1 template.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Reset",
                style: "destructive",
                onPress: resetTemplate,
              },
            ]
          );
        }}
        activeOpacity={0.7}
      >
        <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
        <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>
          Reset to template
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

function PreviewView() {
  const colors = useColors();
  const { generatedText } = useStatus();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(generatedText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      handleShare();
    }
  }, [generatedText]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: generatedText });
    } catch {}
  }, [generatedText]);

  return (
    <View style={styles.flex}>
      <View
        style={[
          styles.previewToolbar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: copied ? colors.success : colors.primary,
            },
          ]}
          onPress={handleCopy}
          activeOpacity={0.85}
        >
          <Feather
            name={copied ? "check" : "copy"}
            size={15}
            color="#fff"
          />
          <Text style={styles.actionBtnText}>
            {copied ? "Copied!" : "Copy text"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtnSecondary,
            {
              backgroundColor: colors.cardSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather name="share" size={15} color={colors.primary} />
          <Text style={[styles.actionBtnSecText, { color: colors.primary }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.flex, { backgroundColor: colors.cardSecondary }]}
        contentContainerStyle={[
          styles.previewContent,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 24) + 80,
          },
        ]}
      >
        <View
          style={[
            styles.previewBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.previewText, { color: colors.foreground }]}
            selectable
          >
            {generatedText}
          </Text>
        </View>
        <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>
          WhatsApp formatting: *bold* is preserved. Tap "Copy text" then paste
          in WhatsApp.
        </Text>
      </ScrollView>
    </View>
  );
}

export default function MainScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("editor");

  const topPad =
    insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 14,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <View
              style={[styles.headerDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              L1 Status Generator
            </Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Fill · Copy · Paste in WhatsApp
          </Text>
        </View>

        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.cardSecondary, borderColor: colors.border },
          ]}
        >
          {(["editor", "preview"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && [
                  styles.tabItemActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name={tab === "editor" ? "edit-3" : "eye"}
                size={14}
                color={
                  activeTab === tab ? "#fff" : colors.mutedForeground
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === tab ? "#fff" : colors.mutedForeground,
                  },
                ]}
              >
                {tab === "editor" ? "Editor" : "Preview"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <InstallBanner />
      {activeTab === "editor" ? <EditorView /> : <PreviewView />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginLeft: 16,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    padding: 16,
    gap: 0,
  },
  metaCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  reportTitleInput: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  metaInput: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  nowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 0,
  },
  nowBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  addSystemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addSystemBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 11,
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  previewToolbar: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionBtnSecText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  previewContent: {
    padding: 16,
    gap: 10,
  },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  previewText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  previewHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
