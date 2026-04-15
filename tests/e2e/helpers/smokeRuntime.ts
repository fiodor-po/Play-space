import {
  expect,
  test as base,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
  type TestInfo,
} from "@playwright/test";

type RuntimeViolation = {
  kind: "console" | "pageerror";
  severity: "warning" | "error";
  pageUrl: string;
  location: string | null;
  text: string;
};

type RuntimeAllowRule = {
  id: string;
  severity: RuntimeViolation["severity"];
  match: (violation: RuntimeViolation) => boolean;
};

export type RuntimeFailureMonitor = {
  attachContext: (context: BrowserContext) => void;
  assertClean: () => Promise<void>;
};

const ACCEPTED_RUNTIME_ALLOWLIST: RuntimeAllowRule[] = [
  {
    id: "local-yjs-websocket-close-before-connect",
    severity: "warning",
    match: (violation) =>
      violation.location?.includes("/y-websocket.js") === true &&
      violation.text.includes("play-space-alpha-") &&
      violation.text.endsWith(
        "failed: WebSocket is closed before the connection is established."
      ),
  },
  {
    id: "chromium-webgl-readpixels-warning",
    severity: "warning",
    match: (violation) =>
      violation.text.includes(
        "GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels"
      ),
  },
  {
    id: "durable-snapshot-load-miss-resource-error",
    severity: "error",
    match: (violation) =>
      violation.location?.includes("/api/room-snapshots/") === true &&
      violation.text ===
        "Failed to load resource: the server responded with a status of 404 (Not Found)",
  },
];

export const test = base.extend<{ runtimeFailureMonitor: RuntimeFailureMonitor }>(
  {
    runtimeFailureMonitor: [
      async ({ context }, use, testInfo) => {
        const monitor = createRuntimeFailureMonitor(testInfo);

        monitor.attachContext(context);

        await use(monitor);
        await monitor.assertClean();
      },
      { auto: true },
    ],
  }
);

export { expect };

function createRuntimeFailureMonitor(testInfo: TestInfo): RuntimeFailureMonitor {
  const trackedContexts = new WeakSet<BrowserContext>();
  const trackedPages = new WeakSet<Page>();
  const violations: RuntimeViolation[] = [];

  const attachPage = (page: Page) => {
    if (trackedPages.has(page)) {
      return;
    }

    trackedPages.add(page);

    page.on("console", (message) => {
      const violation = toConsoleViolation(page, message);

      if (!violation || isAllowedViolation(violation)) {
        return;
      }

      violations.push(violation);
    });

    page.on("pageerror", (error) => {
      violations.push({
        kind: "pageerror",
        severity: "error",
        pageUrl: getPageUrl(page),
        location: null,
        text: formatError(error),
      });
    });
  };

  const attachContext = (context: BrowserContext) => {
    if (trackedContexts.has(context)) {
      return;
    }

    trackedContexts.add(context);
    context.on("page", attachPage);

    for (const page of context.pages()) {
      attachPage(page);
    }
  };

  const assertClean = async () => {
    if (violations.length === 0) {
      return;
    }

    const summary = formatRuntimeViolationSummary(violations);

    await testInfo.attach("runtime-failures", {
      body: summary,
      contentType: "text/plain",
    });

    expect(
      violations,
      `Smoke runtime policy caught disallowed events.\n\n${summary}`
    ).toEqual([]);
  };

  return {
    attachContext,
    assertClean,
  };
}

function toConsoleViolation(
  page: Page,
  message: ConsoleMessage
): RuntimeViolation | null {
  const type = message.type();

  if (type !== "warning" && type !== "error" && type !== "assert") {
    return null;
  }

  return {
    kind: "console",
    severity: type === "warning" ? "warning" : "error",
    pageUrl: getPageUrl(page),
    location: formatConsoleLocation(message),
    text: message.text(),
  };
}

function isAllowedViolation(violation: RuntimeViolation) {
  return ACCEPTED_RUNTIME_ALLOWLIST.some(
    (rule) => rule.severity === violation.severity && rule.match(violation)
  );
}

function formatConsoleLocation(message: ConsoleMessage) {
  const location = message.location();

  if (!location.url) {
    return null;
  }

  const lineSuffix =
    typeof location.lineNumber === "number" ? `:${location.lineNumber}` : "";
  const columnSuffix =
    typeof location.columnNumber === "number" ? `:${location.columnNumber}` : "";

  return `${location.url}${lineSuffix}${columnSuffix}`;
}

function getPageUrl(page: Page) {
  const url = page.url();

  return url.length > 0 ? url : "about:blank";
}

function formatError(error: Error | string) {
  if (typeof error === "string") {
    return error;
  }

  return error.stack ?? error.message;
}

function formatRuntimeViolationSummary(violations: RuntimeViolation[]) {
  return violations
    .map((violation, index) => {
      const locationLine = violation.location
        ? `location: ${violation.location}`
        : "location: n/a";

      return [
        `${index + 1}. ${violation.kind} ${violation.severity}`,
        `page: ${violation.pageUrl}`,
        locationLine,
        `text: ${violation.text}`,
      ].join("\n");
    })
    .join("\n\n");
}
