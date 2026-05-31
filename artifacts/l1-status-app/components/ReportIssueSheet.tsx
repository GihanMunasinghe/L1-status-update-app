import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const PROD_API = "https://status-generator.replit.app";

const API_BASE = (() => {
  if (typeof window === "undefined") return "";
  const { hostname, origin } = window.location;
  if (hostname.includes("github.io") || hostname.includes("replit.app")) {
    return PROD_API;
  }
  return origin;
})();

interface FormState {
  reporterName: string;
  systemName: string;
  issueDescription: string;
  suggestedSolution: string;
}

const EMPTY: FormState = {
  reporterName: "",
  systemName: "",
  issueDescription: "",
  suggestedSolution: "",
};

export function ReportIssueSheet({
  visible,
  onClose,
  defaultSystemName,
}: {
  visible: boolean;
  onClose: () => void;
  defaultSystemName?: string;
}) {
  const colors = useColors();
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    systemName: defaultSystemName ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setForm({ ...EMPTY, systemName: defaultSystemName ?? "" });
    setSubmitted(false);
    setError(null);
    onClose();
  };

  const set = (field: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const canSubmit =
    form.reporterName.trim() &&
    form.systemName.trim() &&
    form.issueDescription.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: form.reporterName.trim(),
          systemName: form.systemName.trim(),
          issueDescription: form.issueDescription.trim(),
          suggestedSolution: form.suggestedSolution.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Feather name="alert-triangle" size={17} color={colors.amber} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Report Issue
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successBox}>
              <View
                style={[styles.successIcon, { backgroundColor: colors.success + "22" }]}
              >
                <Feather name="check-circle" size={36} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                Report Submitted
              </Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Your report has been sent to the admin team for review.
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.form}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <Field label="Your Name *" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  placeholder="e.g. John Silva"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.reporterName}
                  onChangeText={set("reporterName")}
                  autoCapitalize="words"
                />
              </Field>

              <Field label="System Affected *" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  placeholder="e.g. Murex, TLM, GTCS"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.systemName}
                  onChangeText={set("systemName")}
                />
              </Field>

              <Field label="Issue Description *" colors={colors}>
                <TextInput
                  style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  placeholder="Describe the issue in detail…"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.issueDescription}
                  onChangeText={set("issueDescription")}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Field>

              <Field label="Suggested Solution" colors={colors}>
                <TextInput
                  style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  placeholder="Any ideas on how to fix or investigate…"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.suggestedSolution}
                  onChangeText={set("suggestedSolution")}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Field>

              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
                  <Feather name="alert-circle" size={13} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: canSubmit ? colors.primary : colors.border },
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="send" size={15} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: "92%",
    minHeight: 300,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  form: { flex: 1 },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  successBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  doneBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
