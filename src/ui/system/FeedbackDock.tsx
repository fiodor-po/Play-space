import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { HTML_UI_FONT_FAMILY } from "../../board/constants";
import { getDesignSystemDebugAttrs } from "./debugMeta";
import {
  buttonRecipes,
  interactionButtonRecipes,
  getButtonProps,
  type ButtonRecipe,
} from "./families/button";
import { fieldRecipes, getFieldShellProps } from "./families/field";
import { selectionControlRecipes } from "./families/selectionControls";
import { getBoardObjectElevationShadowRecipe } from "./boardMaterials";
import { boardSurfaceRecipes } from "./boardSurfaces";
import { inlineTextRecipes } from "./inlineText";
import { text } from "./foundations";
import { uiTextStyle, uiTextStyleSmall } from "./typography";

type FeedbackType = "bug" | "feedback";
const FLOATING_OBJECT_SHADOW =
  getBoardObjectElevationShadowRecipe("floating").cssBoxShadow;

type FeedbackDockProps = {
  title: string;
  description: string;
  onSubmit: (payload: { type: FeedbackType; message: string }) => Promise<void>;
  wrapperStyle?: CSSProperties;
  panelStyle?: CSSProperties;
  launcherStyle?: CSSProperties;
  launcherRecipe?: ButtonRecipe;
  cancelButtonRecipe?: ButtonRecipe;
  submitButtonRecipe?: ButtonRecipe;
  testIdPrefix?: string;
  bugLabel?: string;
  feedbackLabel?: string;
  messageLabel?: string;
  bugPlaceholder?: string;
  feedbackPlaceholder?: string;
  cancelLabel?: string;
  submitLabel?: string;
  emptyMessageError?: string;
  submitErrorMessage?: string;
};

export function FeedbackDock({
  title,
  description,
  onSubmit,
  wrapperStyle,
  panelStyle,
  launcherStyle,
  launcherRecipe = interactionButtonRecipes.secondary.circle,
  cancelButtonRecipe = buttonRecipes.secondary.small,
  submitButtonRecipe = buttonRecipes.primaryNeutral.small,
  testIdPrefix,
  bugLabel = "Bug",
  feedbackLabel = "Feedback",
  messageLabel = "Message",
  bugPlaceholder = "What happened?",
  feedbackPlaceholder = "What would improve this flow?",
  cancelLabel = "Cancel",
  submitLabel = "Submit",
  emptyMessageError = "Add a short note before submitting.",
  submitErrorMessage = "Could not save feedback. Try again later.",
}: FeedbackDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState("");
  const feedbackTypeSelectionRecipe = selectionControlRecipes.radio.small;
  const feedbackFieldShellProps = getFieldShellProps(fieldRecipes.small.shell, {
    invalid: submitState === "error",
  });
  const launcherButtonProps = getButtonProps(launcherRecipe);
  const cancelButtonProps = getButtonProps(cancelButtonRecipe, {
    disabled: submitState === "submitting",
  });
  const submitButtonProps = getButtonProps(submitButtonRecipe, {
    disabled:
      submitState === "submitting" || feedbackMessage.trim().length === 0,
    loading: submitState === "submitting",
  });

  const closeFeedbackForm = () => {
    if (submitState === "submitting") {
      return;
    }

    setIsOpen(false);
    setSubmitState("idle");
    setStatusMessage("");
    setFeedbackMessage("");
  };

  const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = feedbackMessage.trim();

    if (!trimmedMessage) {
      setSubmitState("error");
      setStatusMessage(emptyMessageError);
      return;
    }

    setSubmitState("submitting");
    setStatusMessage("");

    try {
      await onSubmit({
        type: feedbackType,
        message: trimmedMessage,
      });
      closeFeedbackForm();
    } catch {
      setSubmitState("error");
      setStatusMessage(submitErrorMessage);
    }
  };

  return (
    <div
      style={{
        pointerEvents: "none",
        ...wrapperStyle,
      }}
    >
      {isOpen ? (
        <form
          onSubmit={handleFeedbackSubmit}
          {...getOptionalTestId(testIdPrefix, "form")}
          style={{
            ...boardSurfaceRecipes.floatingShell.shell.style,
            display: "grid",
            gap: 8,
            width: 320,
            maxWidth: "min(320px, calc(100vw - 48px))",
            padding: 14,
            fontFamily: HTML_UI_FONT_FAMILY,
            pointerEvents: "auto",
            ...panelStyle,
          }}
          {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
        >
          <div
            style={{
              display: "grid",
              gap: 4,
            }}
          >
            <div style={{ ...uiTextStyle.label, fontSize: 14 }}>{title}</div>
            <div style={{ ...inlineTextRecipes.muted.style, fontSize: 12 }}>
              {description}
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="Feedback type"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {([
              { id: "bug", label: bugLabel },
              { id: "feedback", label: feedbackLabel },
            ] as const).map((option) => (
              <label
                key={option.id}
                style={feedbackTypeSelectionRecipe.row.style}
                className={feedbackTypeSelectionRecipe.row.className}
                {...getDesignSystemDebugAttrs(feedbackTypeSelectionRecipe.row.debug)}
              >
                <input
                  type="radio"
                  name={testIdPrefix ? `${testIdPrefix}-type` : "feedback-type"}
                  value={option.id}
                  checked={feedbackType === option.id}
                  onChange={() => {
                    setFeedbackType(option.id);
                  }}
                  style={feedbackTypeSelectionRecipe.indicator.style}
                  className={feedbackTypeSelectionRecipe.indicator.className}
                />
                <span
                  style={feedbackTypeSelectionRecipe.label.style}
                  className={feedbackTypeSelectionRecipe.label.className}
                >
                  {option.label}
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
              {messageLabel}
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
                  if (submitState !== "submitting") {
                    setSubmitState("idle");
                    setStatusMessage("");
                  }
                }}
                {...getOptionalTestId(testIdPrefix, "message")}
                rows={4}
                maxLength={2000}
                placeholder={
                  feedbackType === "bug" ? bugPlaceholder : feedbackPlaceholder
                }
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

          {statusMessage ? (
            <div
              role="status"
              {...getOptionalTestId(testIdPrefix, "status")}
              style={{
                ...uiTextStyleSmall.caption,
                color: text.danger,
              }}
            >
              {statusMessage}
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
              {...getOptionalTestId(testIdPrefix, "cancel")}
              {...cancelButtonProps}
              style={cancelButtonProps.style}
              {...getDesignSystemDebugAttrs(cancelButtonRecipe.debug)}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              {...getOptionalTestId(testIdPrefix, "submit")}
              {...submitButtonProps}
              style={submitButtonProps.style}
              {...getDesignSystemDebugAttrs(submitButtonRecipe.debug)}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setSubmitState("idle");
            setStatusMessage("");
          }}
          {...getOptionalTestId(testIdPrefix, "toggle")}
          {...launcherButtonProps}
          style={{
            ...launcherButtonProps.style,
            boxShadow: FLOATING_OBJECT_SHADOW,
            pointerEvents: "auto",
            ...launcherStyle,
          }}
          {...getDesignSystemDebugAttrs(launcherRecipe.debug)}
        >
          <MailGlyph />
        </button>
      )}
    </div>
  );
}

export function MailGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m5 7 7 6 7-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getOptionalTestId(prefix: string | undefined, suffix: string) {
  if (!prefix) {
    return {};
  }

  return {
    "data-testid": `${prefix}-${suffix}`,
  };
}
