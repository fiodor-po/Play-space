import { expect, test } from "@playwright/test";

function colorValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

test.describe("design-system sandbox", () => {
  test("shows visible state deltas for ordinary DOM controls", async ({ page }) => {
    await page.goto("/dev/design-system");

    const firstButton = page
      .locator("section")
      .filter({ hasText: "Ordinary button" })
      .locator("button[data-ui-ds-family=\"button\"]")
      .first();
    const secondaryButton = page
      .locator("section")
      .filter({ hasText: "Ordinary button" })
      .locator("button[data-ui-ds-family=\"button\"]")
      .nth(6);
    await expect(firstButton).toBeVisible();
    await expect(secondaryButton).toBeVisible();

    const readButtonStyles = async () =>
      firstButton.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          background: styles.backgroundColor,
          border: styles.borderTopColor,
          color: styles.color,
          boxShadow: styles.boxShadow,
          surfaceCurrent: styles.getPropertyValue("--ui-button-surface-current").trim(),
          surfaceDefault: styles.getPropertyValue("--ui-button-surface-default").trim(),
          surfaceHover: styles.getPropertyValue("--ui-button-surface-hover").trim(),
        };
      });

    const buttonDefault = await readButtonStyles();
    await firstButton.hover();
    await page.waitForTimeout(180);
    const buttonHover = await readButtonStyles();
    await page.mouse.down();
    await page.waitForTimeout(180);
    const buttonActive = await readButtonStyles();
    await page.mouse.up();

    const secondaryStyles = async () =>
      secondaryButton.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          background: styles.backgroundColor,
          border: styles.borderTopColor,
        };
      });
    const secondaryDefault = await secondaryStyles();
    await secondaryButton.hover();
    await page.waitForTimeout(180);
    const secondaryHover = await secondaryStyles();

    expect(colorValue(buttonHover.background)).not.toBe(colorValue(buttonDefault.background));
    expect(colorValue(buttonActive.background)).not.toBe(colorValue(buttonHover.background));
    expect(colorValue(secondaryHover.background)).not.toBe(
      colorValue(secondaryDefault.background)
    );

    const ordinarySection = page.locator("section").filter({ hasText: "Ordinary button" });
    const disabledButton = ordinarySection.locator("button:disabled").first();
    const loadingButton = ordinarySection.locator("button[data-ui-loading=\"true\"]").first();
    const disabledBackground = await disabledButton.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const loadingOpacity = await loadingButton.evaluate(
      (element) => getComputedStyle(element).opacity
    );
    expect(colorValue(disabledBackground)).not.toBe(colorValue(buttonDefault.background));
    expect(loadingOpacity).not.toBe("1");

    const toggleCard = page
      .locator("div")
      .filter({ has: page.locator("div", { hasText: "Toggle button" }) })
      .first();
    const toggleButtons = toggleCard.locator("button[data-ui-ds-family=\"button\"]");
    const toggleDefault = toggleButtons.nth(0);
    await expect(toggleDefault).toBeVisible();
    const toggleSelected = toggleButtons.nth(4);
    const toggleDefaultStyles = await toggleDefault.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        background: styles.backgroundColor,
        border: styles.borderTopColor,
      };
    });
    const toggleSelectedStyles = await toggleSelected.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        background: styles.backgroundColor,
        border: styles.borderTopColor,
      };
    });

    expect(colorValue(toggleSelectedStyles.background)).not.toBe(
      colorValue(toggleDefaultStyles.background)
    );

    const openTrigger = page
      .locator("section")
      .filter({ hasText: "Menu / popover trigger" })
      .locator("button[data-ui-open=\"true\"]")
      .first();
    const defaultTrigger = page
      .locator("section")
      .filter({ hasText: "Menu / popover trigger" })
      .locator("button[data-ui-ds-family=\"button\"]")
      .first();
    const defaultTriggerBackground = await defaultTrigger.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const openTriggerBackground = await openTrigger.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    expect(colorValue(openTriggerBackground)).not.toBe(colorValue(defaultTriggerBackground));

    const fieldDefaultShell = page.locator("[data-ui-ds-family=\"field\"]").nth(3);
    const fieldErrorShell = page.locator("[data-ui-ds-family=\"field\"]").nth(6);
    const fieldDisabledShell = page
      .locator("section")
      .filter({ hasText: "Text field" })
      .locator("[data-ui-ds-family=\"field\"][data-ui-disabled=\"true\"]")
      .first();
    const fieldDefaultBorder = await fieldDefaultShell.evaluate(
      (element) => getComputedStyle(element).borderTopColor
    );
    const fieldErrorBorder = await fieldErrorShell.evaluate(
      (element) => getComputedStyle(element).borderTopColor
    );
    const fieldDefaultBackground = await fieldDefaultShell.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const fieldDisabledBackground = await fieldDisabledShell.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    expect(colorValue(fieldErrorBorder)).not.toBe(colorValue(fieldDefaultBorder));
    expect(colorValue(fieldDisabledBackground)).not.toBe(colorValue(fieldDefaultBackground));

    const swatchButtons = page.locator("section").filter({ hasText: "Swatch and color choice" });
    const swatchDefault = swatchButtons.getByLabel("default").last();
    const swatchSelected = swatchButtons.getByLabel("selected");
    const swatchOccupied = swatchButtons.getByLabel("occupied");

    const defaultBorder = await swatchDefault.evaluate(
      (element) => getComputedStyle(element).borderTopColor
    );
    const selectedBorder = await swatchSelected.evaluate(
      (element) => getComputedStyle(element).borderTopColor
    );
    const occupiedOpacity = await swatchOccupied.evaluate(
      (element) => getComputedStyle(element).opacity
    );
    const defaultOpacity = await swatchDefault.evaluate(
      (element) => getComputedStyle(element).opacity
    );

    expect(colorValue(selectedBorder)).not.toBe(colorValue(defaultBorder));
    expect(occupiedOpacity).not.toBe(defaultOpacity);
  });
});
