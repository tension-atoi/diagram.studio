/**
 * The desktop shell.
 *
 * Two responsibilities, and the order matters:
 *   1. decide the local port (asking once, on first launch, then remembering),
 *   2. spawn Next's standalone server on it and wait until it answers.
 *
 * The server is spawned as `process.execPath` with ELECTRON_RUN_AS_NODE, i.e.
 * the Electron binary re-used as the Node runtime, so the packaged app never
 * depends on a `node` binary being installed on the user's machine. It is not
 * spawned inside app.asar: extraResources puts it on real disk.
 *
 * Everything the app writes — port, secret, settings, logs, diagram cache —
 * goes to Electron's userData directory, because the bundle itself is
 * read-only (an AppImage mount, /usr/lib under a .deb).
 */
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

/**
 * The dev loop (bun run electron:dev) starts `next dev` itself and hands its
 * URL over here. With a dev URL the app neither asks for a port nor spawns a
 * server: the dev server already owns its port.
 */
const DEV_URL = process.env.ELECTRON_DEV_URL || "";

/** Offered on first launch; the user confirms it before anything starts. */
const DEFAULT_PORT = 7421;
/** Local engine defaults — no hosted service is assumed to exist. */
const ENGINE_DEFAULTS = {
  AI_PROVIDER: "ollama",
  OLLAMA_BASE_URL: "http://127.0.0.1:11434/v1",
  OLLAMA_MODEL: "qwen3.6:35b-studio",
};
const SERVER_START_TIMEOUT_MS = 90_000;

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;
/** @type {import("node:child_process").ChildProcess | null} */
let serverProcess = null;
/** @type {import("node:fs").WriteStream | null} */
let serverLogStream = null;
let shuttingDown = false;

/* ------------------------------------------------------------------ config */

/**
 * @template T
 * @param {string} file
 * @param {T} fallback
 * @returns {T}
 */
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

/**
 * @param {string} file
 * @param {unknown} value
 */
function writeJson(file, value) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, file);
}

/**
 * Values the app persists for itself (port, language, and the model settings
 * the settings dialog writes through the API). Everything here lives in
 * Electron's writable userData directory, never next to the read-only bundle.
 *
 * @param {string} userData
 * @returns {Record<string, string>}
 */
function readPersistedEnv(userData) {
  const file = path.join(userData, ".env.local");
  /** @type {Record<string, string>} */
  const values = {};
  let contents = "";
  try {
    contents = fs.readFileSync(file, "utf8");
  } catch {
    return values;
  }
  for (const line of contents.split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match || !match[1]) continue;
    let value = (match[2] ?? "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

/**
 * The cache and the signing secret are required before the server boots, so
 * both are created on first launch: the secret is random per install and kept
 * at 0600, and the diagram cache moves off the legacy directory name.
 *
 * @param {string} userData
 * @returns {string}
 */
function ensureSecret(userData) {
  const dir = path.join(userData, "secrets");
  const file = path.join(dir, "cache-key");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    const existing = fs.readFileSync(file, "utf8").trim();
    if (existing) {
      fs.chmodSync(file, 0o600);
      return existing;
    }
  } catch {
    // No secret yet — fall through and mint one.
  }
  const secret = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(file, `${secret}\n`, { mode: 0o600 });
  fs.chmodSync(file, 0o600);
  return secret;
}

/* -------------------------------------------------------------------- logs */

/** @param {string} message */
function log(message) {
  const line = `[studio] ${message}\n`;
  if (serverLogStream) serverLogStream.write(line);
  process.stdout.write(line);
}

/* ------------------------------------------------------------------ server */

/** @returns {string} */
function standaloneDir() {
  // Packaged: extraResources puts the build in <resources>/app, on real disk,
  // because a child process cannot read files out of app.asar.
  return app.isPackaged
    ? path.join(process.resourcesPath, "app")
    : path.join(__dirname, "..", ".next", "standalone");
}

/**
 * @param {{ userData: string, port: number, secret: string }} options
 * @returns {import("node:child_process").ChildProcess}
 */
function startServer({ userData, port, secret }) {
  const dir = standaloneDir();
  if (!fs.existsSync(path.join(dir, "server.js"))) {
    throw new Error(
      `No standalone server at ${dir}\n\nRun \`bun run electron:build\` to produce it.`,
    );
  }

  const logsDir = path.join(userData, "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  serverLogStream = fs.createWriteStream(path.join(logsDir, "server.log"), {
    flags: "a",
  });

  /** @type {Record<string, string>} */
  const env = {
    ...ENGINE_DEFAULTS,
    ...process.env,
    ...readPersistedEnv(userData),
    NODE_ENV: "production",
    // The Electron binary doubles as the Node runtime, so the bundle does not
    // depend on a system `node` being installed.
    ELECTRON_RUN_AS_NODE: "1",
    ELECTRON_NO_ATTACH_CONSOLE: "1",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    CACHE_KEY_SECRET: secret,
    DIAGRAM_USER_DATA: userData,
    SITE_URL: `http://127.0.0.1:${port}`,
  };
  delete env.ELECTRON_DEV_URL;

  log(`starting server on http://127.0.0.1:${port} from ${dir}`);
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: dir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  /** @param {Buffer} chunk */
  const relay = (chunk) => {
    const text = chunk.toString();
    if (serverLogStream) serverLogStream.write(text);
    process.stdout.write(text);
  };
  serverProcess.stdout?.on("data", relay);
  serverProcess.stderr?.on("data", relay);

  serverProcess.on("exit", (code, signal) => {
    serverProcess = null;
    if (shuttingDown) return;
    log(`server exited unexpectedly (code=${code} signal=${signal})`);
    dialog.showErrorBox(
      "The local server stopped",
      `The embedded Next.js server exited before the studio was done (code ${code ?? "?"}, signal ${signal ?? "none"}).\n\nDetails: ${path.join(userData, "logs", "server.log")}`,
    );
    app.quit();
  });

  return serverProcess;
}

/** @param {string} url @returns {Promise<number>} */
function probe(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode ?? 0);
    });
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(0);
    });
    request.on("error", () => resolve(0));
  });
}

/**
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
async function waitForServer(url, timeoutMs = SERVER_START_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  // Any HTTP answer — including 503 from /api/healthz when cloud storage is
  // absent — proves Next is serving on this port.
  while (Date.now() < deadline) {
    if (await probe(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

/* ------------------------------------------------------------------ window */

/** @param {string} url */
function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#111418",
    title: "gnu.in.labs / diagram studio",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith("http:") || target.startsWith("https:")) {
      shell.openExternal(target);
    }
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.loadURL(url).catch((error) => {
    log(`failed to load ${url}: ${error instanceof Error ? error.message : String(error)}`);
    dialog.showErrorBox("The studio could not be opened", `${url}\n\n${String(error)}`);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.on("open-external", (_, url) => {
  if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
    shell.openExternal(url);
  }
});

/* ------------------------------------------------------------------- launch */

function stopServer() {
  if (!serverProcess) return;
  shuttingDown = true;
  const child = serverProcess;
  serverProcess = null;
  child.kill("SIGTERM");
  const timer = setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
      // Already gone.
    }
  }, 3000);
  timer.unref?.();
}

/**
 * First launch of the packaged app asks the user to confirm the port. The
 * answer is persisted in config.json, which stays hand-editable (and is what
 * the local MCP endpoint documentation reads from).
 *
 * @param {string} userData
 * @returns {Promise<number>}
 */
async function resolvePort(userData) {
  if (DEV_URL) return Number(new URL(DEV_URL).port) || DEFAULT_PORT;
  if (process.env.DIAGRAM_PORT) return Number(process.env.DIAGRAM_PORT) || DEFAULT_PORT;

  const configPath = path.join(userData, "config.json");
  const config = readJson(configPath, null);
  if (config && Number.isInteger((/** @type {{port?: unknown}} */ (config)).port)) {
    return /** @type {{port: number}} */ (config).port;
  }

  const port = DEFAULT_PORT;
  const answer = await dialog.showMessageBox({
    type: "question",
    title: "gnu.in.labs / diagram studio",
    message: "Choose the local port",
    detail:
      `The studio and its local MCP endpoint will listen on\n\n` +
      `    http://127.0.0.1:${port}\n\n` +
      `Confirm to start. To change it later, edit\n\n    ${configPath}\n\n` +
      `and relaunch — MCP clients read the endpoint from here.`,
    buttons: [`Use port ${port}`, "Open config file"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  writeJson(configPath, { port, onboardedAt: new Date().toISOString() });
  if (answer.response === 1) {
    setTimeout(() => void shell.openPath(configPath), 500);
  }
  return port;
}

async function bootstrap() {
  if (DEV_URL) {
    createWindow(DEV_URL);
    return;
  }

  const userData = app.getPath("userData");
  fs.mkdirSync(userData, { recursive: true });

  const port = await resolvePort(userData);
  const secret = ensureSecret(userData);

  try {
    startServer({ userData, port, secret });
  } catch (error) {
    dialog.showErrorBox(
      "The embedded server could not start",
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
    return;
  }

  const url = `http://127.0.0.1:${port}`;
  if (!(await waitForServer(url))) {
    dialog.showErrorBox(
      "The local server did not answer in time",
      `${url} never responded within ${SERVER_START_TIMEOUT_MS / 1000}s.\n\nDetails: ${path.join(userData, "logs", "server.log")}`,
    );
    app.quit();
    return;
  }

  createWindow(url);
}

app
  .whenReady()
  .then(() => bootstrap())
  .catch((error) => {
    dialog.showErrorBox(
      "The studio failed to start",
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    app.quit();
  });

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void bootstrap();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopServer);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopServer();
    app.quit();
  });
}