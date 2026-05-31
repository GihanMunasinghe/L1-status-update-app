import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useStatus } from "@/context/StatusContext";
import { useColors } from "@/hooks/useColors";

function SmallButton({
  label,
  icon,
  onPress,
  color,
  danger,
}: {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  const colors = useColors();
  const btnColor = danger ? colors.destructive : color ?? colors.primary;
  return (
    <TouchableOpacity
      style={[styles.smallBtn, { borderColor: btnColor + "44" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Feather name={icon} size={13} color={btnColor} />}
      {label && (
        <Text style={[styles.smallBtnText, { color: btnColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function LineItem({
  si,
  bi,
  li,
  numbered,
}: {
  si: number;
  bi: number;
  li: number;
  numbered: boolean;
}) {
  const colors = useColors();
  const { state, updateLine, deleteLine } = useStatus();
  const ln = state.systems[si].subs[bi].lines[li];
  const prefix = numbered ? `${li + 1})` : "•";

  const handleHighlight = useCallback(
    (val: boolean) => {
      Haptics.selectionAsync();
      updateLine(si, bi, li, "highlight", val);
    },
    [si, bi, li, updateLine]
  );

  return (
    <View
      style={[
        styles.lineRow,
        ln.highlight && {
          backgroundColor: colors.amberBg,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderLeftWidth: 3,
          borderLeftColor: colors.amber,
        },
      ]}
    >
      <Text style={[styles.prefix, { color: colors.mutedForeground }]}>
        {prefix}
      </Text>
      <TextInput
        style={[
          styles.lineInput,
          {
            color: ln.highlight ? colors.amberInk : colors.foreground,
            backgroundColor: "transparent",
          },
        ]}
        value={ln.text}
        onChangeText={(v) => updateLine(si, bi, li, "text", v)}
        placeholder="Status line…"
        placeholderTextColor={colors.mutedForeground}
        multiline
      />
      <Switch
        value={ln.highlight}
        onValueChange={handleHighlight}
        trackColor={{ false: colors.border, true: colors.amber + "88" }}
        thumbColor={ln.highlight ? colors.amber : colors.mutedForeground}
        style={styles.lineSwitch}
      />
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          deleteLine(si, bi, li);
        }}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="x" size={14} color={colors.destructive} />
      </TouchableOpacity>
    </View>
  );
}

function SectionCard({ si, bi }: { si: number; bi: number }) {
  const colors = useColors();
  const { state, updateSub, deleteSub, addLine } = useStatus();
  const sub = state.systems[si].subs[bi];

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.cardSecondary, borderColor: colors.border },
      ]}
    >
      <View style={styles.sectionHead}>
        <TextInput
          style={[
            styles.sectionTitleInput,
            { color: colors.foreground, borderColor: colors.border },
          ]}
          value={sub.title}
          onChangeText={(v) => updateSub(si, bi, "title", v)}
          placeholder="Section title (optional)"
          placeholderTextColor={colors.mutedForeground}
        />
        <View style={styles.sectionHeadRight}>
          <View style={styles.numberedRow}>
            <Text style={[styles.numberedLabel, { color: colors.mutedForeground }]}>
              #
            </Text>
            <Switch
              value={sub.numbered}
              onValueChange={(v) => {
                Haptics.selectionAsync();
                updateSub(si, bi, "numbered", v);
              }}
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={sub.numbered ? colors.primary : colors.mutedForeground}
              style={styles.miniSwitch}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              deleteSub(si, bi);
            }}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {sub.lines.map((_, li) => (
        <LineItem key={_.id} si={si} bi={bi} li={li} numbered={sub.numbered} />
      ))}

      <TouchableOpacity
        style={[styles.addLineBtn, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          addLine(si, bi);
        }}
        activeOpacity={0.7}
      >
        <Feather name="plus" size={13} color={colors.primary} />
        <Text style={[styles.addLineBtnText, { color: colors.primary }]}>
          Add line
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function IssueCard({ si, ii }: { si: number; ii: number }) {
  const colors = useColors();
  const { state, updateIssue, deleteIssue } = useStatus();
  const iss = state.systems[si].ongoing[ii];

  return (
    <View
      style={[
        styles.issueCard,
        {
          backgroundColor: colors.destructiveBg,
          borderColor: colors.destructive + "44",
          borderLeftColor: colors.destructive,
        },
      ]}
    >
      <View style={styles.issueHead}>
        <Text style={[styles.issueBadge, { color: colors.destructive }]}>
          ONGOING #{ii + 1}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteIssue(si, ii);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={15} color={colors.destructive} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={[
          styles.issueTextArea,
          {
            color: colors.foreground,
            borderColor: colors.destructive + "33",
          },
        ]}
        value={iss.text}
        onChangeText={(v) => updateIssue(si, ii, "text", v)}
        placeholder="Describe the issue…"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <View style={styles.issueFieldRow}>
        <Feather name="user" size={13} color={colors.mutedForeground} style={styles.issueFieldIcon} />
        <TextInput
          style={[
            styles.issueInlineInput,
            {
              color: colors.foreground,
              borderColor: colors.destructive + "33",
            },
          ]}
          value={iss.supporter}
          onChangeText={(v) => updateIssue(si, ii, "supporter", v)}
          placeholder="Checking: person or team (e.g. John, Murex L2)"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>
      <View style={styles.issueFieldRow}>
        <Feather name="clock" size={13} color={colors.mutedForeground} style={styles.issueFieldIcon} />
        <TextInput
          style={[
            styles.issueInlineInput,
            {
              color: colors.foreground,
              borderColor: colors.destructive + "33",
            },
          ]}
          value={iss.eta}
          onChangeText={(v) => updateIssue(si, ii, "eta", v)}
          placeholder="ETA (e.g. 30 mins, 03:00 PM, TBD)"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>
    </View>
  );
}

export function SystemCard({ si }: { si: number }) {
  const colors = useColors();
  const { state, updateSystem, deleteSystem, addIssue, addSub } = useStatus();
  const sys = state.systems[si];
  const hasIssues = sys.ongoing.length > 0;

  return (
    <View
      style={[
        styles.systemCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.systemHead}>
        <View
          style={[styles.systemAccent, { backgroundColor: colors.primary }]}
        />
        <View style={styles.systemInputs}>
          <TextInput
            style={[
              styles.systemNameInput,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={sys.name}
            onChangeText={(v) => updateSystem(si, "name", v)}
            placeholder="System name"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
          />
          <TextInput
            style={[
              styles.systemCompInput,
              { color: colors.mutedForeground, borderColor: colors.border },
            ]}
            value={sys.components}
            onChangeText={(v) => updateSystem(si, "components", v)}
            placeholder="Components (e.g. MX3, EWRS, Python)"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteSystem(si);
          }}
          style={styles.deleteSystemBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.ongoingBox,
          {
            borderColor: hasIssues
              ? colors.destructive + "55"
              : colors.border,
            backgroundColor: hasIssues
              ? colors.destructiveBg + "88"
              : colors.cardSecondary,
          },
        ]}
      >
        <View style={styles.ongoingHeader}>
          <Feather
            name="alert-triangle"
            size={13}
            color={hasIssues ? colors.destructive : colors.mutedForeground}
          />
          <Text
            style={[
              styles.ongoingTitle,
              {
                color: hasIssues
                  ? colors.destructive
                  : colors.mutedForeground,
              },
            ]}
          >
            Ongoing Issues
          </Text>
        </View>
        {sys.ongoing.map((_, ii) => (
          <IssueCard key={_.id} si={si} ii={ii} />
        ))}
        <SmallButton
          icon="plus"
          label="Add issue"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            addIssue(si);
          }}
          color={colors.destructive}
        />
      </View>

      <View style={styles.sectionsArea}>
        <Text style={[styles.sectionsLabel, { color: colors.mutedForeground }]}>
          STATUS SECTIONS
        </Text>
        {sys.subs.map((_, bi) => (
          <SectionCard key={_.id} si={si} bi={bi} />
        ))}
        <SmallButton
          icon="plus"
          label="Add section"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            addSub(si);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  smallBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 3,
  },
  prefix: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 20,
    textAlign: "center",
  },
  lineInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    padding: 4,
  },
  lineSwitch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
  deleteBtn: {
    padding: 2,
  },
  sectionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitleInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    borderBottomWidth: 1,
    paddingBottom: 4,
    paddingTop: 0,
  },
  sectionHeadRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numberedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  numberedLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  miniSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  addLineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  addLineBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  issueCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
    marginBottom: 6,
  },
  issueHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  issueBadge: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  issueTextArea: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    minHeight: 60,
  },
  issueFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  issueFieldIcon: {
    width: 18,
    textAlign: "center",
  },
  issueInlineInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  systemCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  systemHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
  },
  systemAccent: {
    width: 4,
    height: "100%" as unknown as number,
    borderRadius: 2,
    minHeight: 40,
  },
  systemInputs: {
    flex: 1,
    gap: 6,
  },
  systemNameInput: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    borderBottomWidth: 1,
    paddingBottom: 4,
    paddingTop: 0,
  },
  systemCompInput: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  deleteSystemBtn: {
    padding: 4,
    marginTop: 2,
  },
  ongoingBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  ongoingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ongoingTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionsArea: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  sectionsLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
});
