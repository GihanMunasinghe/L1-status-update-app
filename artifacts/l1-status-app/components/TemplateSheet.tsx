import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStatus } from "@/context/StatusContext";
import type { TemplateEntry } from "@/context/StatusContext";
import { useColors } from "@/hooks/useColors";

function TemplateCard({
  entry,
  onLoad,
  onDelete,
}: {
  entry: TemplateEntry;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const systemCount = entry.state.systems.length;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {entry.name}
          </Text>
          <View style={styles.cardMeta}>
            <Feather name="layers" size={11} color={colors.mutedForeground} />
            <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
              {systemCount} system{systemCount !== 1 ? "s" : ""}
            </Text>
            <Text style={[styles.cardDot, { color: colors.border }]}>·</Text>
            <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
              {new Date(entry.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text
            style={[styles.cardSystems, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {entry.state.systems.map((s) => s.name).join(", ")}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.loadBtn, { backgroundColor: colors.primary }]}
            onPress={onLoad}
            activeOpacity={0.85}
          >
            <Feather name="upload" size={12} color="#fff" />
            <Text style={styles.loadBtnText}>Load</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: colors.destructive + "55" }]}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={12} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function TemplateSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const { templates, saveAsTemplate, loadTemplate, deleteTemplate } = useStatus();
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const name = nameInput.trim();
    if (!name) return;
    setSaving(true);
    saveAsTemplate(name);
    setNameInput("");
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLoad = (id: string, name: string) => {
    Alert.alert(
      `Load "${name}"?`,
      "This will replace your current systems and sections. Date, time, and shift engineer will stay as-is.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          style: "default",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadTemplate(id);
            onClose();
          },
        },
      ]
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      `Delete "${name}"?`,
      "This template will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteTemplate(id);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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
              <Feather name="bookmark" size={17} color={colors.primary} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Templates
              </Text>
              {templates.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{templates.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.saveRow,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <TextInput
              style={[
                styles.nameInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Template name…"
              placeholderTextColor={colors.mutedForeground}
              value={nameInput}
              onChangeText={setNameInput}
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor:
                    nameInput.trim() ? colors.primary : colors.border,
                },
              ]}
              onPress={handleSave}
              disabled={!nameInput.trim() || saving}
              activeOpacity={0.85}
            >
              <Feather name="save" size={14} color="#fff" />
              <Text style={styles.saveBtnText}>Save current</Text>
            </TouchableOpacity>
          </View>

          {templates.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="bookmark" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                No templates saved
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Type a name above and tap "Save current" to save your systems structure as a reusable template.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {templates.map((entry) => (
                <TemplateCard
                  key={entry.id}
                  entry={entry}
                  onLoad={() => handleLoad(entry.id, entry.name)}
                  onDelete={() => handleDelete(entry.id, entry.name)}
                />
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
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
    maxHeight: "88%",
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
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  nameInput: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    gap: 10,
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  cardDot: {
    fontSize: 11,
  },
  cardSystems: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  loadBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },
});
