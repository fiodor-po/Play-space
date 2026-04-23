import { forwardRef, useState, type FormEvent, type ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";
import {
  buttonRecipes,
  createTextButtonRecipe,
  getButtonProps,
} from "../../ui/system/families/button";
import { fieldRecipes, getFieldShellProps } from "../../ui/system/families/field";
import { boardSurfaceRecipes } from "../../ui/system/boardSurfaces";
import { selectionControlRecipes } from "../../ui/system/families/selectionControls";
import { inlineTextRecipes } from "../../ui/system/inlineText";
import { border, surface, text } from "../../ui/system/foundations";
import { fontSize, uiTextStyle, uiTextStyleSmall } from "../../ui/system/typography";
import type { LiveKitMediaStatusViewModel } from "../../media/liveKitMediaStatus";
import {
  buildFeedbackCapturePayload,
  submitFeedbackCapture,
  type FeedbackCaptureContext,
  type FeedbackCaptureType,
} from "../../lib/feedbackCapture";

type ParticipantSessionPanelProps = {
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorColor: string | null;
  participantName: string;
  participantColor: string;
  participantNameDraft: string;
  isEditingParticipantName: boolean;
  mediaStatus: LiveKitMediaStatusViewModel | null;
  feedbackContext: FeedbackCaptureContext;
  isDebugToolsEnabled: boolean;
  isDevToolsOpen: boolean;
  onLeaveRoom: () => void;
  onResetBoard: () => void;
  onToggleDevTools: () => void;
  onParticipantNameDraftChange: (value: string) => void;
  onParticipantNameSubmit: () => void;
  onStartEditingParticipantName: () => void;
  devToolsContent: ReactNode;
};

export const ParticipantSessionPanel = forwardRef<
  HTMLDivElement,
  ParticipantSessionPanelProps
>(function ParticipantSessionPanel(
  {
    roomId,
    isCurrentParticipantRoomCreator,
    roomCreatorName,
    roomCreatorColor,
    participantName,
    participantColor,
    participantNameDraft,
    isEditingParticipantName,
    mediaStatus,
    feedbackContext,
    isDebugToolsEnabled,
    isDevToolsOpen,
    onLeaveRoom,
    onResetBoard,
    onToggleDevTools,
    onParticipantNameDraftChange,
    onParticipantNameSubmit,
    onStartEditingParticipantName,
    devToolsContent,
  },
  ref
) {
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [feedbackType, setFeedbackType] =
    useState<FeedbackCaptureType>("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitState, setFeedbackSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [feedbackStatusMessage, setFeedbackStatusMessage] = useState("");
  const leaveRoomButtonRecipe = createTextButtonRecipe(
    buttonRecipes.secondary.small,
    "muted"
  );
  const feedbackButtonRecipe = createTextButtonRecipe(
    buttonRecipes.secondary.small,
    "muted"
  );
  const feedbackCancelButtonRecipe = createTextButtonRecipe(
    buttonRecipes.secondary.small,
    "muted"
  );
  const feedbackSubmitButtonRecipe = buttonRecipes.primaryNeutral.small;
  const mediaActionButtonRecipe = createTextButtonRecipe(
    buttonRecipes.secondary.small,
    "muted"
  );
  const resetBoardButtonRecipe = buttonRecipes.danger.small;
  const devToolsSelectionRecipe = selectionControlRecipes.checkbox.small;
  const feedbackTypeSelectionRecipe = selectionControlRecipes.radio.small;
  const feedbackSubmitButtonProps = getButtonProps(feedbackSubmitButtonRecipe, {
    disabled:
      feedbackSubmitState === "submitting" || feedbackMessage.trim().length === 0,
    loading: feedbackSubmitState === "submitting",
  });
  const feedbackCancelButtonProps = getButtonProps(feedbackCancelButtonRecipe, {
    disabled: feedbackSubmitState === "submitting",
  });
  const mediaActionButtonLabel = mediaStatus?.isMediaConnected
    ? "Leave media"
    : mediaStatus?.isMediaJoining
      ? "Joining..."
      : "Join media";
  const shouldShowMediaActionButton =
    mediaStatus !== null &&
    (mediaStatus.canLeaveMedia ||
      mediaStatus.canJoinMedia ||
      mediaStatus.isMediaJoining);
  const isMediaActionButtonDisabled =
    mediaStatus === null ||
    mediaStatus.isMediaJoining ||
    (!mediaStatus.canLeaveMedia && !mediaStatus.canJoinMedia);
  const mediaActionButtonProps = getButtonProps(mediaActionButtonRecipe, {
    disabled: isMediaActionButtonDisabled,
    loading: mediaStatus?.isMediaJoining ?? false,
  });
  const resetVideoPositionsButtonProps = getButtonProps(mediaActionButtonRecipe);
  const feedbackFieldShellProps = getFieldShellProps(fieldRecipes.small.shell, {
    invalid: feedbackSubmitState === "error",
  });

  const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = feedbackMessage.trim();

    if (!trimmedMessage) {
      setFeedbackSubmitState("error");
      setFeedbackStatusMessage("Add a short note before submitting.");
      return;
    }

    setFeedbackSubmitState("submitting");
    setFeedbackStatusMessage("");

    try {
      await submitFeedbackCapture(
        buildFeedbackCapturePayload({
          type: feedbackType,
          message: trimmedMessage,
          context: feedbackContext,
        })
      );

      setFeedbackSubmitState("success");
      setFeedbackStatusMessage("Feedback saved. Thank you.");
      setFeedbackMessage("");
    } catch {
      setFeedbackSubmitState("error");
      setFeedbackStatusMessage("Could not save feedback. Try again later.");
    }
  };

  const closeFeedbackForm = () => {
    if (feedbackSubmitState === "submitting") {
      return;
    }

    setIsFeedbackFormOpen(false);
    setFeedbackSubmitState("idle");
    setFeedbackStatusMessage("");
  };

  return (
    <div
      ref={ref}
      style={{
        ...boardSurfaceRecipes.floatingShell.shell.style,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 10,
        minWidth: 180,
        maxWidth: "min(360px, calc(100vw - 40px))",
        maxHeight: "calc(100vh - 40px)",
        paddingBottom: 14,
        fontFamily: HTML_UI_FONT_FAMILY,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            ...uiTextStyle.label,
            fontSize: 15,
            pointerEvents: "none",
            overflowWrap: "anywhere",
          }}
        >
          {roomId}
        </div>
        <button
          type="button"
          onClick={onLeaveRoom}
          data-testid="session-leave-room-button"
          {...getButtonProps(leaveRoomButtonRecipe)}
          style={{
            ...getButtonProps(leaveRoomButtonRecipe).style,
            justifyContent: "flex-end",
            pointerEvents: "auto",
          }}
          {...getDesignSystemDebugAttrs(leaveRoomButtonRecipe.debug)}
        >
          Leave room
        </button>
      </div>

      {isCurrentParticipantRoomCreator || roomCreatorName ? (
        <div
          style={{
            ...inlineTextRecipes.muted.style,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isCurrentParticipantRoomCreator ? (
            "Room Owner: You"
          ) : (
            <>
              {"Room Owner: "}
              <span style={{ color: roomCreatorColor ?? text.secondary }}>
                {roomCreatorName}
              </span>
            </>
          )}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {isEditingParticipantName ? (
          <input
            value={participantNameDraft}
            onChange={(event) => {
              onParticipantNameDraftChange(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              onParticipantNameSubmit();
            }}
            autoFocus
            style={{
              minWidth: 0,
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: participantColor,
              fontSize: fontSize["2xl"],
              fontWeight: 700,
              fontFamily: HTML_UI_FONT_FAMILY,
              pointerEvents: "auto",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={onStartEditingParticipantName}
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              color: participantColor,
              fontSize: fontSize["2xl"],
              fontWeight: 700,
              fontFamily: HTML_UI_FONT_FAMILY,
              cursor: "text",
              pointerEvents: "auto",
            }}
          >
            {participantName}
          </button>
        )}
      </div>

      {mediaStatus ? (
        <div
          style={{
            display: "grid",
            gap: 6,
            marginTop: 2,
            paddingTop: 10,
            borderTop: `1px solid ${border.default}`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => {
                mediaStatus.onResetVideoPositions();
              }}
              data-testid="session-reset-video-positions-button"
              {...resetVideoPositionsButtonProps}
              style={{
                ...resetVideoPositionsButtonProps.style,
                justifyContent: "flex-start",
                pointerEvents: "auto",
              }}
              {...getDesignSystemDebugAttrs(mediaActionButtonRecipe.debug)}
            >
              Reset video positions
            </button>
            {shouldShowMediaActionButton ? (
              <button
                type="button"
                onClick={() => {
                  if (mediaStatus.isMediaConnected) {
                    mediaStatus.onLeaveMedia();
                    return;
                  }

                  mediaStatus.onJoinMedia();
                }}
                data-testid="session-media-toggle-button"
                {...mediaActionButtonProps}
                style={{
                  ...mediaActionButtonProps.style,
                  justifyContent: "flex-end",
                  pointerEvents: "auto",
                }}
                {...getDesignSystemDebugAttrs(mediaActionButtonRecipe.debug)}
              >
                {mediaActionButtonLabel}
              </button>
            ) : null}
          </div>
          {mediaStatus.mediaErrorLabel ? (
            <div
              style={{
                color: "#fecaca",
                fontSize: 12,
                lineHeight: "16px",
                pointerEvents: "none",
              }}
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
      ) : null}

      {isCurrentParticipantRoomCreator && (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 2,
            paddingTop: 10,
            borderTop: `1px solid ${border.default}`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              ...uiTextStyleSmall.label,
              color: text.muted,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            Room tools
          </div>

          <button
            type="button"
            onClick={onResetBoard}
            {...getButtonProps(resetBoardButtonRecipe)}
            style={{
              ...getButtonProps(resetBoardButtonRecipe).style,
              textAlign: "left",
              justifyContent: "flex-start",
              pointerEvents: "auto",
            }}
            {...getDesignSystemDebugAttrs(resetBoardButtonRecipe.debug)}
          >
            Reset board
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 8,
          marginTop: 2,
          paddingTop: 10,
          borderTop: `1px solid ${border.default}`,
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsFeedbackFormOpen((current) => !current);
            setFeedbackSubmitState("idle");
            setFeedbackStatusMessage("");
          }}
          data-testid="session-feedback-toggle"
          {...getButtonProps(feedbackButtonRecipe)}
          style={{
            ...getButtonProps(feedbackButtonRecipe).style,
            justifyContent: "flex-start",
            pointerEvents: "auto",
          }}
          {...getDesignSystemDebugAttrs(feedbackButtonRecipe.debug)}
        >
          Report bug
        </button>

        {isFeedbackFormOpen ? (
          <form
            onSubmit={handleFeedbackSubmit}
            data-testid="session-feedback-form"
            style={{
              display: "grid",
              gap: 8,
              padding: 10,
              border: `1px solid ${border.default}`,
              borderRadius: 8,
              background: surface.inset,
              pointerEvents: "auto",
            }}
          >
            <div
              role="radiogroup"
              aria-label="Feedback type"
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              {(["bug", "feedback"] as const).map((type) => (
                <label
                  key={type}
                  style={feedbackTypeSelectionRecipe.row.style}
                  className={feedbackTypeSelectionRecipe.row.className}
                  {...getDesignSystemDebugAttrs(
                    feedbackTypeSelectionRecipe.row.debug
                  )}
                >
                  <input
                    type="radio"
                    name="session-feedback-type"
                    value={type}
                    checked={feedbackType === type}
                    onChange={() => {
                      setFeedbackType(type);
                    }}
                    style={feedbackTypeSelectionRecipe.indicator.style}
                    className={feedbackTypeSelectionRecipe.indicator.className}
                  />
                  <span
                    style={feedbackTypeSelectionRecipe.label.style}
                    className={feedbackTypeSelectionRecipe.label.className}
                  >
                    {type === "bug" ? "Bug" : "Feedback"}
                  </span>
                </label>
              ))}
            </div>

            <label
              style={{
                display: "grid",
                gap: 5,
              }}
            >
              <span
                style={{
                  ...uiTextStyleSmall.label,
                  color: text.muted,
                }}
              >
                Message
              </span>
              <span
                {...feedbackFieldShellProps}
                style={{
                  ...feedbackFieldShellProps.style,
                  alignItems: "stretch",
                  minHeight: 88,
                }}
              >
                <textarea
                  value={feedbackMessage}
                  onChange={(event) => {
                    setFeedbackMessage(event.target.value);
                    if (feedbackSubmitState !== "submitting") {
                      setFeedbackSubmitState("idle");
                      setFeedbackStatusMessage("");
                    }
                  }}
                  data-testid="session-feedback-message"
                  rows={4}
                  maxLength={2000}
                  placeholder="What happened?"
                  style={{
                    ...fieldRecipes.small.input.style,
                    minHeight: 70,
                    resize: "vertical",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: HTML_UI_FONT_FAMILY,
                  }}
                />
              </span>
            </label>

            {feedbackStatusMessage ? (
              <div
                role="status"
                data-testid="session-feedback-status"
                style={{
                  ...uiTextStyleSmall.caption,
                  color:
                    feedbackSubmitState === "error" ? text.danger : text.secondary,
                }}
              >
                {feedbackStatusMessage}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={closeFeedbackForm}
                data-testid="session-feedback-cancel"
                {...feedbackCancelButtonProps}
                style={feedbackCancelButtonProps.style}
                {...getDesignSystemDebugAttrs(feedbackCancelButtonRecipe.debug)}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="session-feedback-submit"
                {...feedbackSubmitButtonProps}
                style={feedbackSubmitButtonProps.style}
                {...getDesignSystemDebugAttrs(feedbackSubmitButtonRecipe.debug)}
              >
                Submit
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {isDebugToolsEnabled ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 2,
            paddingTop: 10,
            borderTop: `1px solid ${border.default}`,
            pointerEvents: "none",
            minHeight: 0,
            flex: isDevToolsOpen ? 1 : "0 0 auto",
          }}
        >
          <label
            style={{
              ...devToolsSelectionRecipe.row.style,
              pointerEvents: "auto",
            }}
            className={devToolsSelectionRecipe.row.className}
            {...getDesignSystemDebugAttrs(devToolsSelectionRecipe.row.debug)}
          >
            <input
              type="checkbox"
              data-testid="session-debug-tools-toggle"
              checked={isDevToolsOpen}
              onChange={() => {
                onToggleDevTools();
              }}
              style={devToolsSelectionRecipe.indicator.style}
              className={devToolsSelectionRecipe.indicator.className}
            />
            <span
              style={devToolsSelectionRecipe.label.style}
              className={devToolsSelectionRecipe.label.className}
            >
              Debug tools
            </span>
          </label>

          {isDevToolsOpen && (
            <div
              style={{
                pointerEvents: "auto",
                minHeight: 0,
                overflowY: "auto",
                overscrollBehavior: "contain",
                paddingRight: 4,
              }}
            >
              {devToolsContent}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});
