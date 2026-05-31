import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const DISMISSED_KEY = "install_banner_dismissed";

function isIOS(): boolean {
  if (Platform.OS !== "web") return false;
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (Platform.OS !== "web") return false;
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type Step = { icon: string; text: string };

const IOS_STEPS: Step[] = [
  { icon: "share", text: 'Tap the Share button at the bottom of Safari' },
  { icon: "plus-square", text: 'Scroll down and tap "Add to Home Screen"' },
  { icon: "check-circle", text: 'Tap "Add" — done! Open it like a normal app' },
];

const ANDROID_STEPS: Step[] = [
  { icon: "more-vertical", text: 'Tap the three-dot menu (⋮) in Chrome' },
  { icon: "plus-square", text: 'Tap "Add to Home Screen"' },
  { icon: "check-circle", text: 'Tap "Add" — done! Open it like a normal app' },
];

export function InstallBanner() {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (isStandalone()) return;

    AsyncStorage.getItem(DISMISSED_KEY).then((val) => {
      if (val !== "1") setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const steps = ios ? IOS_STEPS : ANDROID_STEPS;
  const platform = ios ? "iPhone" : "Android";
  const browserName = ios ? "Safari" : "Chrome";

  return (
    <>
      {/* Banner */}
      <TouchableOpacity
        style={[
          styles.banner,
          { backgroundColor: colors.card, borderColor: colors.primary },
        ]}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="download" size={16} color={colors.primary} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
            Add to Home Screen
          </Text>
          <Text style={[styles.bannerSub, { color: colors.mutedForeground }]}>
            Install on your {platform} for quick access
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={(e) => { e.stopPropagation?.(); dismiss(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Instructions Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIconWrap, { backgroundColor: colors.primary + "22" }]}>
                <Feather name="smartphone" size={22} color={colors.primary} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Install on {platform}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                  Open in {browserName} and follow these steps
                </Text>
              </View>
            </View>

            {/* Steps */}
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={[styles.stepIconWrap, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                  <Feather name={step.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>
                  {step.text}
                </Text>
              </View>
            ))}

            {/* Note */}
            <View style={[styles.note, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
              <Feather name="info" size={13} color={colors.mutedForeground} />
              <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                Once installed, it opens full-screen with no browser bar — just like a native app.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, { backgroundColor: colors.primary }]}
                onPress={() => setModalOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetBtnText}>Got it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetBtnSecondary, { borderColor: colors.border }]}
                onPress={() => { setModalOpen(false); dismiss(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetBtnSecText, { color: colors.mutedForeground }]}>
                  Don't show again
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 36,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  dismissBtn: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  sheetActions: {
    gap: 8,
    marginTop: 4,
  },
  sheetBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  sheetBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  sheetBtnSecondary: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: "center",
  },
  sheetBtnSecText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
