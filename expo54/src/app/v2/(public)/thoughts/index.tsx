import { Routes } from "@/src";
import { LoadModel, ModelLoadedProps } from "@/src/hooks/use-model";
import { useSafeWindowDimensions } from "@/src/hooks/use-safe-area";
import { Action, Model, Thought } from "@/src/model";
import { EmotionDeltaBadge } from "@/src/view/emotion-badge";
import { ThoughtCard } from "@/src/view/thought-card";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return <LoadModel ready={Ready} />;
}

function Ready(props: ModelLoadedProps) {
  const { model, dispatch, style: s, translate: t } = props;
  const [viewMode, setViewMode] = useState<"deck" | "list">("deck");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Newest thoughts first for the swipeable deck
  const allThoughts = Model.thoughtsList(model).slice().reverse();
  const dateGroups = Model.thoughtsByDate(model);
  const today = new Date().toDateString();

  const isDark =
    model.settings.theme === "dark" ||
    (model.settings.theme === null && model.deviceColorScheme === "dark");
  const locale = Model.locale(model);

  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const windowDim = useSafeWindowDimensions();
  const carouselWidth = Math.min(windowDim.width - 32, s.container.maxWidth);
  const carouselHeight = Math.max(300, windowDim.height - 180);

  // Desktop keyboard navigation (Left/Right arrows)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "deck" || allThoughts.length <= 1) return;
      if (e.key === "ArrowLeft") {
        carouselRef.current?.prev();
      } else if (e.key === "ArrowRight") {
        carouselRef.current?.next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, allThoughts.length]);

  const textColor = s.text.color;
  const borderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
  const activeBtnBg = "#546de5";

  if (allThoughts.length === 0) {
    return (
      <SafeAreaView style={[s.view]}>
        <View style={[s.container, styles.emptyContainer]}>
          <Feather
            name="book-open"
            size={48}
            color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
            style={{ marginBottom: 16 }}
          />
          <Text style={[s.subheader, { textAlign: "center" }]}>
            {t("cbt_list.empty")}
          </Text>
          <Link href={Routes.thoughtCreateV2()} asChild>
            <TouchableOpacity style={[s.button, s.bgSelected, s.mt4]}>
              <Text style={[s.selectedText]}>
                + {t("accessibility.new_thought_button")}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.view]}>
      <View style={[s.container, styles.mainContainer]}>
        {/* Navigation Toolbar */}
        <View style={styles.toolbar}>
          {/* Deck Counter & Desktop Controls */}
          {viewMode === "deck" ? (
            <View style={styles.deckNavControls}>
              <TouchableOpacity
                style={[
                  styles.arrowBtn,
                  { borderColor, opacity: currentIndex > 0 ? 1 : 0.4 },
                ]}
                disabled={currentIndex === 0}
                onPress={() => carouselRef.current?.prev()}
                accessibilityLabel={t("cbt_list.prev") || "Previous"}
              >
                <Feather name="chevron-left" size={18} color={textColor} />
              </TouchableOpacity>

              <Text style={[styles.counterText, { color: textColor }]}>
                {t("cbt_list.record_counter", {
                  current: currentIndex + 1,
                  total: allThoughts.length,
                }) || `${currentIndex + 1} / ${allThoughts.length}`}
              </Text>

              <TouchableOpacity
                style={[
                  styles.arrowBtn,
                  {
                    borderColor,
                    opacity: currentIndex < allThoughts.length - 1 ? 1 : 0.4,
                  },
                ]}
                disabled={currentIndex >= allThoughts.length - 1}
                onPress={() => carouselRef.current?.next()}
                accessibilityLabel={t("cbt_list.next") || "Next"}
              >
                <Feather name="chevron-right" size={18} color={textColor} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[s.subheader, { marginBottom: 0 }]}>
              {allThoughts.length}{" "}
              {locale === "ar" ? "أفكار مسجلة" : "Thoughts"}
            </Text>
          )}

          {/* View Toggle Buttons */}
          <View style={[styles.toggleGroup, { borderColor }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === "deck" && { backgroundColor: activeBtnBg },
              ]}
              onPress={() => setViewMode("deck")}
            >
              <Feather
                name="layers"
                size={14}
                color={viewMode === "deck" ? "#fff" : textColor}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === "deck" ? "#fff" : textColor },
                ]}
              >
                {t("cbt_list.deck_view") || "Cards"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === "list" && { backgroundColor: activeBtnBg },
              ]}
              onPress={() => setViewMode("list")}
            >
              <Feather
                name="list"
                size={14}
                color={viewMode === "list" ? "#fff" : textColor}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === "list" ? "#fff" : textColor },
                ]}
              >
                {t("cbt_list.list_view") || "List"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content: Swipeable Deck vs. Grouped List */}
        {viewMode === "deck" ? (
          <View style={styles.deckWrapper}>
            <Carousel
              ref={carouselRef}
              data={allThoughts}
              width={carouselWidth}
              height={carouselHeight}
              loop={false}
              onProgressChange={progress}
              onSnapToItem={(idx) => setCurrentIndex(idx)}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.94,
                parallaxScrollingOffset: Math.round(carouselWidth * 0.08),
              }}
              // Ensures horizontal swipes flip cards, while vertical touches scroll inside the card
              onConfigurePanGesture={(gesture) => {
                "worklet";
                gesture.activeOffsetX([-15, 15]);
              }}
              renderItem={({ item: thought }) => (
                <View style={styles.carouselItemContainer}>
                  <ThoughtCard
                    thought={thought}
                    model={model}
                    style={s}
                    translate={t}
                    isDark={isDark}
                    locale={locale}
                    onDelete={() => dispatch(Action.deleteThought(thought.uuid))}
                  />
                </View>
              )}
            />
            {allThoughts.length > 1 && (
              <Pagination.Basic
                progress={progress}
                data={allThoughts}
                dotStyle={s.paginationDot}
                activeDotStyle={s.activePaginationDot}
                containerStyle={styles.paginationContainer}
                onPress={(idx) => {
                  carouselRef.current?.scrollTo({
                    count: idx - progress.value,
                    animated: true,
                  });
                }}
              />
            )}
          </View>
        ) : (
          <ScrollView style={styles.listScrollView}>
            {dateGroups.map(([date, thoughts]) => (
              <React.Fragment key={date}>
                <Text style={[s.subheader, { marginTop: 14, marginBottom: 8 }]}>
                  {today === date ? t("cbt_list.today") : date}
                </Text>
                {thoughts.map((thought) => (
                  <View
                    key={thought.uuid}
                    style={[
                      styles.listItemRow,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "#fff",
                        borderColor,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.listItemContent}
                      onPress={() => {
                        const targetIdx = allThoughts.findIndex(
                          (t) => t.uuid === thought.uuid
                        );
                        if (targetIdx >= 0) {
                          setCurrentIndex(targetIdx);
                          setViewMode("deck");
                        }
                      }}
                    >
                      <Text style={[styles.listItemTitle, { color: textColor }]}>
                        {Thought.label(thought, model)}
                      </Text>

                      {thought.emotions && thought.emotions.length > 0 && (
                        <View style={styles.listItemEmotionsRow}>
                          {thought.emotions.map((em, idx) => (
                            <EmotionDeltaBadge
                              key={`${em.name}-${idx}`}
                              emotion={em}
                              isDark={isDark}
                              compact={true}
                            />
                          ))}
                        </View>
                      )}

                      {Thought.emojis(thought) ? (
                        <Text style={[styles.emojisBadge, { color: textColor }]}>
                          {Thought.emojis(thought)}
                        </Text>
                      ) : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.listDeleteBtn}
                      onPress={() => dispatch(Action.deleteThought(thought.uuid))}
                    >
                      <Feather name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </React.Fragment>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  deckNavControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  toggleGroup: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deckWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselItemContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 4,
  },
  paginationContainer: {
    gap: 6,
    marginTop: 8,
  },
  listScrollView: {
    flex: 1,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginRight: 8,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  listItemEmotionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  emojisBadge: {
    fontSize: 16,
  },
  listDeleteBtn: {
    padding: 8,
    borderRadius: 8,
  },
});
