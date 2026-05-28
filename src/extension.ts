/**
 * extension.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Main entry point for the Monsterverse Pet Companion VS Code extension.
 *
 * Responsibilities:
 *  - Activate / deactivate lifecycle
 *  - Instantiate PetPanel (sidebar webview)
 *  - Instantiate ActivityTracker and wire state changes → webview
 *  - Register all commands via commands.ts
 *  - Persist / restore globalState between sessions
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import * as fs from 'fs';

import { registerCommands } from './commands';
import { ActivityTracker, TrackerState } from './activityTracker';
import {
  MonsterId,
  MONSTERS,
  getMonster,
  getRandomMoodMessage,
  MonsterStateMessage,
} from './monsterManager';

// ─── Global State Keys ────────────────────────────────────────────────────────

const KEY_MONSTER   = 'monsterverse.selectedMonster';
const KEY_SCORE     = 'monsterverse.activityScore';
const KEY_ERRORS    = 'monsterverse.errorCount';
const KEY_SESSION   = 'monsterverse.sessionTime';

// ─── Nonce Helper ────────────────────────────────────────────────────────────

/** Generate a random nonce string for CSP script-src. */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// ─── PetPanel ─────────────────────────────────────────────────────────────────

/**
 * Manages the Webview panel rendered inside the Monsterverse sidebar view.
 * Handles HTML generation, message passing, and hot-reload of state.
 */
class PetPanel {
  public static currentPanel: PetPanel | undefined;

  private readonly _view: vscode.WebviewView;
  private readonly _extensionUri: vscode.Uri;
  private _monsterId: MonsterId;

  constructor(view: vscode.WebviewView, extensionUri: vscode.Uri, monsterId: MonsterId) {
    this._view = view;
    this._extensionUri = extensionUri;
    this._monsterId = monsterId;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, 'webview'),
        vscode.Uri.joinPath(extensionUri, 'media'),
      ],
    };

    view.webview.onDidReceiveMessage((message) => {
      if (message && typeof message.command === 'string') {
        vscode.commands.executeCommand(message.command);
      }
    });

    view.webview.html = this._getHtml();
  }

  /** Switch active monster and refresh the panel. */
  public setMonster(id: MonsterId): void {
    this._monsterId = id;
    this._view.webview.postMessage({
      type: 'SWITCH_MONSTER',
      monster: id,
    });
  }

  /** Push a state update to the webview. */
  public sendState(state: TrackerState): void {
    const msg: MonsterStateMessage = {
      type: 'UPDATE_STATE',
      monster: this._monsterId,
      mood: state.mood,
      evolution: state.evolution,
      activityScore: state.activityScore,
      errorCount: state.errorCount,
      sessionTime: state.sessionTime,
      message: getRandomMoodMessage(this._monsterId, state.mood),
    };
    this._view.webview.postMessage(msg);
  }

  /** Reveal the sidebar panel. */
  public reveal(): void {
    this._view.show?.(true);
  }

  // ─── HTML Generation ──────────────────────────────────────────────────────

  private _getHtml(): string {
    const webview = this._view.webview;
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'webview', 'panel.html');
    const cssUri   = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'styles.css'));
    const jsUri    = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'panel.js'));

    // Read the HTML template and inject resource URIs + initial monster data
    const nonce = getNonce();
    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');
    const monster  = getMonster(this._monsterId);
    
    const imageUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', monster.imagePath));

    // Build full sprite + flyer maps for all monsters (for multi-spawn)
    const spritesMap: Record<string, string> = {};
    const flyerMap: Record<string, boolean> = {};
    for (const [id, m] of Object.entries(MONSTERS)) {
      spritesMap[id] = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, 'webview', m.imagePath)
      ).toString();
      flyerMap[id] = !!m.isFlyer;
    }

    // Replace template placeholders
    html = html
      .replace(/\{\{CSS_URI\}\}/g, cssUri.toString())
      .replace(/\{\{JS_URI\}\}/g, jsUri.toString())
      .replace(/\{\{MONSTER_ID\}\}/g, monster.id)
      .replace(/\{\{MONSTER_NAME\}\}/g, monster.displayName)
      .replace(/\{\{MONSTER_TAGLINE\}\}/g, monster.tagline)
      .replace(/\{\{PRIMARY_COLOR\}\}/g, monster.primaryColor)
      .replace(/\{\{SECONDARY_COLOR\}\}/g, monster.secondaryColor)
      .replace(/\{\{ACCENT_COLOR\}\}/g, monster.accentColor)
      .replace(/\{\{GLOW_COLOR\}\}/g, monster.glowColor)
      .replace(/\{\{ANIM_SPEED\}\}/g, String(monster.animationSpeed))
      .replace(/\{\{JITTER\}\}/g, monster.jitterIntensity)
      .replace(/\{\{IS_FLYER\}\}/g, String(!!monster.isFlyer))
      .replace(/\{\{IMAGE_URI\}\}/g, imageUri.toString())
      .replace(/\{\{\s*MONSTER_SPRITES_MAP\s*\}\}/g, JSON.stringify(spritesMap))
      .replace(/\{\{\s*IS_FLYER_MAP\s*\}\}/g, JSON.stringify(flyerMap))
      .replace(/\{\{CSP_SOURCE\}\}/g, webview.cspSource)
      .replace(/\{\{NONCE\}\}/g, nonce);

    return html;
  }
}

// ─── Sidebar View Provider ────────────────────────────────────────────────────

/**
 * Provides the Webview that lives in the Monsterverse activity bar sidebar.
 * VS Code calls `resolveWebviewView` once the panel becomes visible.
 */
class MonsterSidebarProvider implements vscode.WebviewViewProvider {
  public petPanel: PetPanel | undefined;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private _monsterId: MonsterId,
    private readonly _onReady: (panel: PetPanel) => void
  ) {}

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.petPanel = new PetPanel(view, this._extensionUri, this._monsterId);
    this._onReady(this.petPanel);
  }

  public setMonster(id: MonsterId): void {
    this._monsterId = id;
    this.petPanel?.setMonster(id);
  }
}

// ─── Activate ─────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Monsterverse] Extension activating…');

  // ── Restore persisted state ──────────────────────────────────────────────
  let savedMonster =
    (context.globalState.get<string>(KEY_MONSTER) as MonsterId | undefined) ?? 'godzilla';
  if (!getMonster(savedMonster as MonsterId)) {
    savedMonster = 'godzilla';
  }
  const savedScore   = context.globalState.get<number>(KEY_SCORE) ?? 0;

  // ── Activity Tracker ─────────────────────────────────────────────────────
  const tracker = new ActivityTracker(savedMonster, savedScore);

  // ── Sidebar Provider ─────────────────────────────────────────────────────
  let activePetPanel: PetPanel | undefined;

  const provider = new MonsterSidebarProvider(
    context.extensionUri,
    savedMonster,
    (panel) => {
      activePetPanel = panel;
      // Send initial state as soon as the webview is ready
      activePetPanel.sendState(tracker.getState());
    }
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('monsterverse.petView', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // ── Wire tracker → webview ───────────────────────────────────────────────
  tracker.on('stateChange', (state: TrackerState) => {
    activePetPanel?.sendState(state);

    // Persist score periodically
    context.globalState.update(KEY_SCORE,   state.activityScore);
    context.globalState.update(KEY_ERRORS,  state.errorCount);
    context.globalState.update(KEY_SESSION, state.sessionTime);
  });

  // ── Helper: select monster ───────────────────────────────────────────────
  function selectMonster(id: MonsterId): void {
    tracker.setMonster(id);
    provider.setMonster(id);
    context.globalState.update(KEY_MONSTER, id);

    // Send refreshed state immediately after switch
    setTimeout(() => activePetPanel?.sendState(tracker.getState()), 300);
  }

  // ── Register commands ────────────────────────────────────────────────────
  registerCommands(context, {
    selectMonster,
    togglePanel: () => {
      vscode.commands.executeCommand('monsterverse.petView.focus');
    },
    showPanel: () => {
      activePetPanel?.reveal();
      vscode.commands.executeCommand('monsterverse.petView.focus');
    },
    resetMood: () => {
      tracker.resetMood();
    },
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  context.subscriptions.push({
    dispose: () => {
      tracker.dispose();
    },
  });

  console.log('[Monsterverse] Extension activated ✓');
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

export function deactivate(): void {
  console.log('[Monsterverse] Extension deactivated.');
}
