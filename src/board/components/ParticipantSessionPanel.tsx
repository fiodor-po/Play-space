import {
  IconBug,
  IconDoorExit,
  IconDots,
  IconRefresh,
  IconSettings,
  IconVideo,
  IconVideoOff,
  type TablerIcon,
} from "@tabler/icons-react";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";
import {
  buttonRecipes,
  getButtonProps,
  interactionButtonRecipes,
} from "../../ui/system/families/button";
import { boardSurfaceRecipes } from "../../ui/system/boardSurfaces";
import {
  getBoardBackgroundTheme,
  getBoardBackgroundThemeOptions,
} from "../../ui/system/boardMaterials";
import { uiTextStyle, uiTextStyleSmall } from "../../ui/system/typography";
import { FeedbackDock, MailGlyph } from "../../ui/system/FeedbackDock";
import { ContextMenu, type ContextMenuItem } from "../../ui/system/ContextMenu";
import { FloatingPanel } from "../../ui/system/FloatingPanel";
import type { LiveKitMediaStatusViewModel } from "../../media/liveKitMediaStatus";
import {
  buildFeedbackCapturePayload,
  submitFeedbackCapture,
  type FeedbackCaptureContext,
} from "../../lib/feedbackCapture";
import type { RoomBackgroundThemeId } from "../../lib/roomSettings";
import { border, text } from "../../ui/system/foundations";

type ParticipantSessionPanelProps = {
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorColor: string | null;
  roomBackgroundThemeId: RoomBackgroundThemeId;
  participantName: string;
  participantColor: string;
  mediaStatus: LiveKitMediaStatusViewModel | null;
  feedbackContext: FeedbackCaptureContext;
  isDebugToolsEnabled: boolean;
  isDevToolsOpen: boolean;
  onLeaveRoom: () => void;
  onResetBoard: () => void;
  onRoomBackgroundThemeChange: (backgroundThemeId: RoomBackgroundThemeId) => void;
  onToggleDevTools: () => void;
  devToolsContent: ReactNode;
  placement?: "fixed" | "inline";
};

type AnchorPoint = {
  x: number;
  y: number;
};

const SESSION_PANEL_Z_INDEX = 10;
const SESSION_MENU_Z_INDEX = 45;
const SESSION_FEEDBACK_Z_INDEX = 44;

export const ParticipantSessionPanel = forwardRef<
  HTMLDivElement,
  ParticipantSessionPanelProps
>(function ParticipantSessionPanel(
  {
    roomId,
    isCurrentParticipantRoomCreator,
    roomCreatorName,
    roomCreatorColor,
    roomBackgroundThemeId,
    participantName,
    participantColor,
    mediaStatus,
    feedbackContext,
    isDebugToolsEnabled,
    isDevToolsOpen,
    onLeaveRoom,
    onResetBoard,
    onRoomBackgroundThemeChange,
    onToggleDevTools,
    devToolsContent,
    placement = "fixed",
  },
  ref
) {
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const [sessionMenuAnchorPoint, setSessionMenuAnchorPoint] =
    useState<AnchorPoint | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackAnchorPoint, setFeedbackAnchorPoint] =
    useState<AnchorPoint | null>(null);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const feedbackButtonRef = useRef<HTMLButtonElement | null>(null);
  const feedbackPanelRef = useRef<HTMLDivElement | null>(null);
  const iconButtonRecipe = interactionButtonRecipes.secondary.circle;
  const iconButtonProps = getButtonProps(iconButtonRecipe);
  const resetBoardButtonRecipe = buttonRecipes.danger.small;
  const roomBackgroundButtonRecipe = buttonRecipes.secondary.small;
  const roomBackgroundTheme = getBoardBackgroundTheme(roomBackgroundThemeId);
  const roomBackgroundOptions = getBoardBackgroundThemeOptions();
  const sessionTitleColor =
    roomCreatorColor ??
    (isCurrentParticipantRoomCreator ? participantColor : text.primary);
  const sessionTitle = roomId.toUpperCase();
  const mediaActionLabel = mediaStatus?.isMediaConnected
    ? "Leave media"
    : mediaStatus?.isMediaJoining
      ? "Joining..."
      : "Join media";
  const shouldShowMediaAction =
    mediaStatus !== null &&
    (mediaStatus.canLeaveMedia || mediaStatus.canJoinMedia || mediaStatus.isMediaJoining);
  const isMediaActionDisabled =
    mediaStatus === null ||
    mediaStatus.isMediaJoining ||
    (!mediaStatus.canLeaveMedia && !mediaStatus.canJoinMedia);

  useLayoutEffect(() => {
    if (!isSessionMenuOpen) {
      setSessionMenuAnchorPoint(null);
      return;
    }

    const updateSessionMenuAnchor = () => {
      const buttonRect = menuButtonRef.current?.getBoundingClientRect();

      if (!buttonRect) {
        setSessionMenuAnchorPoint(null);
        return;
      }

      setSessionMenuAnchorPoint({
        x: buttonRect.left,
        y: buttonRect.bottom + 8,
      });
    };

    updateSessionMenuAnchor();
    window.addEventListener("resize", updateSessionMenuAnchor);
    window.addEventListener("scroll", updateSessionMenuAnchor, true);

    return () => {
      window.removeEventListener("resize", updateSessionMenuAnchor);
      window.removeEventListener("scroll", updateSessionMenuAnchor, true);
    };
  }, [isSessionMenuOpen]);

  useLayoutEffect(() => {
    if (!isFeedbackOpen) {
      setFeedbackAnchorPoint(null);
      return;
    }

    const updateFeedbackAnchor = () => {
      const buttonRect = feedbackButtonRef.current?.getBoundingClientRect();

      if (!buttonRect) {
        setFeedbackAnchorPoint(null);
        return;
      }

      setFeedbackAnchorPoint({
        x: buttonRect.left,
        y: buttonRect.bottom + 8,
      });
    };

    updateFeedbackAnchor();
    window.addEventListener("resize", updateFeedbackAnchor);
    window.addEventListener("scroll", updateFeedbackAnchor, true);

    return () => {
      window.removeEventListener("resize", updateFeedbackAnchor);
      window.removeEventListener("scroll", updateFeedbackAnchor, true);
    };
  }, [isFeedbackOpen]);

  useEffect(() => {
    if (!isFeedbackOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (feedbackPanelRef.current?.contains(target) ||
          feedbackButtonRef.current?.contains(target))
      ) {
        return;
      }

      setIsFeedbackOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFeedbackOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isFeedbackOpen]);

  const sessionMenuItems: ContextMenuItem[] = [
    {
      type: "section-label",
      id: "session-media-section",
      label: "Media",
    },
    ...(shouldShowMediaAction
      ? [
          {
            type: "item" as const,
            id: "session-media-toggle",
            label: mediaActionLabel,
            disabled: isMediaActionDisabled,
            icon: mediaStatus?.isMediaConnected ? (
              <IconVideoOff size={16} stroke={2} />
            ) : (
              <IconVideo size={16} stroke={2} />
            ),
            onSelect: () => {
              if (!mediaStatus) {
                return;
              }

              if (mediaStatus.isMediaConnected) {
                mediaStatus.onLeaveMedia();
                return;
              }

              mediaStatus.onJoinMedia();
            },
          },
        ]
      : []),
    {
      type: "item",
      id: "session-reset-video-positions",
      label: "Reset video positions",
      disabled: mediaStatus === null,
      icon: <IconRefresh size={16} stroke={2} />,
      onSelect: () => {
        mediaStatus?.onResetVideoPositions();
      },
    },
    ...(isCurrentParticipantRoomCreator
      ? [
          {
            type: "separator" as const,
            id: "session-room-separator",
          },
          {
            type: "item" as const,
            id: "session-room-settings",
            label: "Room settings",
            icon: <IconSettings size={16} stroke={2} />,
            onSelect: () => {
              setIsRoomSettingsOpen(true);
            },
          },
        ]
      : []),
    ...(isDebugToolsEnabled
      ? [
          {
            type: "separator" as const,
            id: "session-debug-separator",
          },
          {
            type: "item" as const,
            id: "session-debug-tools",
            label: "Open debug panel",
            icon: <IconBug size={16} stroke={2} />,
            testId: "session-debug-tools-menu-item",
            onSelect: () => {
              if (!isDevToolsOpen) {
                onToggleDevTools();
              }
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: 8,
          position: placement === "fixed" ? "fixed" : "relative",
          top: placement === "fixed" ? 20 : undefined,
          left: placement === "fixed" ? 20 : undefined,
          zIndex: SESSION_PANEL_Z_INDEX,
          pointerEvents: "none",
          fontFamily: HTML_UI_FONT_FAMILY,
        }}
      >
        <div
          ref={ref}
          style={{
            ...boardSurfaceRecipes.floatingShell.shell.style,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto auto auto",
            alignItems: "center",
            gap: 8,
            minWidth: 292,
            maxWidth: "min(380px, calc(100vw - 40px))",
            padding: "10px 10px 10px 14px",
            pointerEvents: "auto",
          }}
          {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
        >
          <div
            title={roomId}
            style={{
              ...uiTextStyle.label,
              minWidth: 0,
              color: sessionTitleColor,
              fontWeight: 700,
              letterSpacing: "0.045em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {sessionTitle}
          </div>

          <SessionIconButton
            ariaLabel="Leave room"
            Icon={IconDoorExit}
            iconButtonProps={iconButtonProps}
            iconButtonRecipe={iconButtonRecipe}
            onClick={onLeaveRoom}
            testId="session-leave-room-button"
          />

          <SessionIconButton
            ref={menuButtonRef}
            ariaLabel="Open session menu"
            Icon={IconDots}
            iconButtonProps={iconButtonProps}
            iconButtonRecipe={iconButtonRecipe}
            isOpen={isSessionMenuOpen}
            onClick={() => {
              setIsFeedbackOpen(false);
              setIsSessionMenuOpen((current) => !current);
            }}
            testId="session-menu-button"
          />

          <div
            aria-hidden="true"
            style={{
              width: 1,
              height: 24,
              marginInline: 2,
              background: border.default,
            }}
          />

          <button
            ref={feedbackButtonRef}
            type="button"
            aria-label="Open feedback panel"
            {...getButtonProps(iconButtonRecipe, { open: isFeedbackOpen })}
            style={{
              ...getButtonProps(iconButtonRecipe, { open: isFeedbackOpen }).style,
              width: 32,
              minWidth: 32,
              minHeight: 32,
              padding: 0,
            }}
            onClick={() => {
              setIsSessionMenuOpen(false);
              setIsFeedbackOpen((current) => !current);
            }}
            {...getDesignSystemDebugAttrs(iconButtonRecipe.debug)}
          >
            <MailGlyph />
          </button>
        </div>

        {mediaStatus?.mediaErrorLabel ? (
          <div
            style={{
              ...boardSurfaceRecipes.floatingShell.shell.style,
              maxWidth: 292,
              padding: "10px 12px",
              color: "#fecaca",
              fontSize: 12,
              lineHeight: "16px",
              pointerEvents: "none",
            }}
            {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
          >
            <div>{mediaStatus.mediaErrorLabel}</div>
            {mediaStatus.mediaErrorDetail ? (
              <div style={{ marginTop: 3, color: "#fca5a5" }}>
                {mediaStatus.mediaErrorDetail}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isSessionMenuOpen ? (
        <ContextMenu
          anchorPoint={sessionMenuAnchorPoint}
          ariaLabel="Session menu"
          items={sessionMenuItems}
          minWidth={230}
          onClose={() => {
            setIsSessionMenuOpen(false);
          }}
          zIndex={SESSION_MENU_Z_INDEX}
        />
      ) : null}

      {isFeedbackOpen && feedbackAnchorPoint ? (
        <div
          ref={feedbackPanelRef}
          style={{
            position: "fixed",
            left: feedbackAnchorPoint.x,
            top: feedbackAnchorPoint.y,
            zIndex: SESSION_FEEDBACK_Z_INDEX,
          }}
        >
          <FeedbackDock
            open
            hideLauncher
            title="Report a problem"
            description="Quick note from the current room, with a short path for bugs and general feedback."
            testIdPrefix="session-feedback"
            onOpenChange={setIsFeedbackOpen}
            onSubmit={async ({ type, message }) => {
              await submitFeedbackCapture(
                buildFeedbackCapturePayload({
                  type,
                  message,
                  context: feedbackContext,
                })
              );
            }}
          />
        </div>
      ) : null}

      {isCurrentParticipantRoomCreator && isRoomSettingsOpen ? (
        <FloatingPanel
          title="Room settings"
          mode="modal"
          width={380}
          cancelLabel="Close room settings"
          onCancel={() => {
            setIsRoomSettingsOpen(false);
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <section style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  ...uiTextStyleSmall.label,
                  color: text.muted,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Board material
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {roomBackgroundOptions.map((option) => {
                  const isSelected = option.id === roomBackgroundThemeId;
                  const buttonProps = getButtonProps(roomBackgroundButtonRecipe, {
                    selected: isSelected,
                  });

                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isSelected}
                      {...buttonProps}
                      style={{
                        ...buttonProps.style,
                        justifyContent: "space-between",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onClick={() => {
                        onRoomBackgroundThemeChange(option.id);
                      }}
                      {...getDesignSystemDebugAttrs(roomBackgroundButtonRecipe.debug)}
                    >
                      <span>{option.label}</span>
                      {isSelected ? <span aria-hidden="true">✓</span> : null}
                    </button>
                  );
                })}
              </div>
              <div style={{ ...uiTextStyleSmall.body, color: text.muted }}>
                Current: {roomBackgroundTheme.label}
              </div>
            </section>

            {isCurrentParticipantRoomCreator ? (
              <section style={{ display: "grid", gap: 10 }}>
                <div
                  style={{
                    ...uiTextStyleSmall.label,
                    color: text.muted,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Room actions
                </div>
                <button
                  type="button"
                  {...getButtonProps(resetBoardButtonRecipe)}
                  style={{
                    ...getButtonProps(resetBoardButtonRecipe).style,
                    justifyContent: "flex-start",
                    width: "100%",
                  }}
                  onClick={onResetBoard}
                  {...getDesignSystemDebugAttrs(resetBoardButtonRecipe.debug)}
                >
                  Reset board
                </button>
              </section>
            ) : null}

            {roomCreatorName || participantName ? (
              <div style={{ ...uiTextStyleSmall.body, color: text.muted }}>
                Room owner:{" "}
                <span style={{ color: roomCreatorColor ?? participantColor }}>
                  {isCurrentParticipantRoomCreator
                    ? `${participantName} (you)`
                    : roomCreatorName ?? "Unknown"}
                </span>
              </div>
            ) : null}
          </div>
        </FloatingPanel>
      ) : null}

      {isDebugToolsEnabled && isDevToolsOpen ? (
        <FloatingPanel
          title="Debug tools"
          mode="floating"
          width={420}
          initialPosition={{ x: 20, y: 84 }}
          cancelLabel="Close debug tools"
          onCancel={onToggleDevTools}
        >
          <div
            style={{
              maxHeight: "min(520px, calc(100vh - 160px))",
              overflowY: "auto",
              overscrollBehavior: "contain",
              paddingRight: 4,
            }}
          >
            {devToolsContent}
          </div>
        </FloatingPanel>
      ) : null}
    </>
  );
});

const SessionIconButton = forwardRef<
  HTMLButtonElement,
  {
    ariaLabel: string;
    Icon: TablerIcon;
    iconButtonProps: ReturnType<typeof getButtonProps>;
    iconButtonRecipe: typeof interactionButtonRecipes.secondary.circle;
    isOpen?: boolean;
    onClick: () => void;
    testId?: string;
  }
>(function SessionIconButton(
  {
    ariaLabel,
    Icon,
    iconButtonProps,
    iconButtonRecipe,
    isOpen = false,
    onClick,
    testId,
  },
  ref
) {
  const buttonProps = isOpen
    ? getButtonProps(iconButtonRecipe, { open: true })
    : iconButtonProps;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      data-testid={testId}
      {...buttonProps}
      style={{
        ...buttonProps.style,
        width: 32,
        minWidth: 32,
        minHeight: 32,
        padding: 0,
      }}
      onClick={onClick}
      {...getDesignSystemDebugAttrs(iconButtonRecipe.debug)}
    >
      <Icon aria-hidden="true" size={18} stroke={2} />
    </button>
  );
});
