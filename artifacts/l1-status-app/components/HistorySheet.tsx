import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useStatus } from "@/context/StatusContext";
import type { HistoryEntry } from "@/context/StatusContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function preview(text: string): string {
  return text
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("━"))
    .slice(2, 5)
    .join("  ·  ")
    .slice(0, 100);
}

function EntryCard({
  entry,
  onDelete,
}: {
  entry: HistoryEntry;
  onDelete: () => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(entry.text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded((v) => !v);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardTime, { color: colors.primary }]}>
              {timeAgo(entry.savedAt)}
            </Text>
            {entry.shiftEngineer ? (
              <View style={styles.engineerBadge}>
                <Feather name="user-check" size={10} color={colors.mutedForeground} />
                <Text style={[styles.engineerText, { color: colors.mutedForeground }]}>
                  {entry.shiftEngineer}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.cardDatetime, { color: colors.mutedForeground }]}>
              {[entry.date, entry.time].filter(Boolean).join("  ")}
            </Text>
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.mutedForeground}
            />
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {entry.title}
        </Text>

        {!expanded && (
          <Text
            style={[styles.cardPreview, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {preview(entry.text)}
          </Text>
        )}
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ScrollView
            style={[styles.fullTextScroll, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            nestedScrollEnabled
          >
            <Text style={[styles.fullText, { color: colors.foreground }]} selectable>
              {entry.text}
            </Text>
          </ScrollView>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: copied ? colors.success : colors.primary },
              ]}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              <Feather name={copied ? "check" : "copy"} size={13} color="#fff" />
              <Text style={styles.actionBtnText}>
                {copied ? "Copied!" : "Copy text"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: colors.destructive + "55" }]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={13} color={colors.destructive} />
              <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export function HistorySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const { history, deleteHistoryEntry, clearHistory } = useStatus();

  const handleClearAll = () => {
    Alert.alert(
      "Clear all history?",
      "This will permanently delete all saved reports.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear all", style: "destructive", onPress: clearHistory },
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
              <Feather name="clock" size={17} color={colors.primary} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                History
              </Text>
              {history.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{history.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.sheetHeaderRight}>
              {history.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearAll}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.clearAll, { color: colors.destructive }]}>
                    Clear all
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                No history yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Reports are saved automatically when you copy or share them.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {history.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    deleteHistoryEntry(entry.id);
                  }}
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
  sheetHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  clearAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTime: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  engineerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  engineerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDatetime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  cardPreview: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  fullTextScroll: {
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 220,
    padding: 10,
    marginBottom: 10,
  },
  fullText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 9,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
