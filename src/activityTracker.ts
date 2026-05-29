/**
 * activityTracker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks all VS Code editor events (typing, save, diagnostics, idle) and
 * translates them into mood signals consumed by the PetPanel.
 *
 * Architecture:
 *   VS Code Events → ActivityTracker → MoodEvent (EventEmitter) → PetPanel
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import {
  MoodState,
  MonsterId,
  getEvolutionStage,
  EvolutionStage,
} from './monsterManager';

// ─── Constants ────────────────────────────────────────────────────────────────


/** How many error-free saves to calm down from "angry". */
const ANGER_COOL_SAVES = 3;

/** Activity score increments per event type. */
const SCORE = {
  type: 1,
  save: 10,
  open: 5,
  build: 25,
} as const;

// ─── Exported State Shape ─────────────────────────────────────────────────────

export interface TrackerState {
  mood: MoodState;
  activityScore: number;
  errorCount: number;
  sessionTime: number; // seconds
  evolution: EvolutionStage;
}

// ─── ActivityTracker ──────────────────────────────────────────────────────────

export class ActivityTracker extends EventEmitter {
  // Internal state
  private mood: MoodState = 'idle';
  private activityScore: number = 0;
  private errorCount: number = 0;
  private sessionStart: number = Date.now();
  private lastActivityTime: number = Date.now();
  private cleanSaves: number = 0;

  // VS Code subscriptions
  private disposables: vscode.Disposable[] = [];

  // Timers
  private sessionTimer: NodeJS.Timeout | undefined;

  /** Current monster – used to read personality-specific modifiers. */
  private monsterId: MonsterId;

  constructor(monsterId: MonsterId, savedScore: number = 0) {
    super();
    this.monsterId = monsterId;
    this.activityScore = savedScore;
    this._registerListeners();
    this._startSessionTimer();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Call when the active monster changes. */
  public setMonster(id: MonsterId): void {
    this.monsterId = id;
  }

  /** Force mood externally (e.g., "Reset Mood" command). */
  public resetMood(): void {
    this.mood = 'idle';
    this.cleanSaves = 0;
    this._emit();
  }

  /** Called when extension detects a successful build/run terminal task. */
  public triggerVictory(): void {
    this.activityScore += SCORE.build;
    this._setMood('victory');
    // Return to idle after 4 s
    setTimeout(() => {
      if (this.mood === 'victory') { this._setMood('idle'); }
    }, 4000);
  }

  /** Return a snapshot of current tracker state. */
  public getState(): TrackerState {
    return {
      mood: this.mood,
      activityScore: this.activityScore,
      errorCount: this.errorCount,
      sessionTime: Math.floor((Date.now() - this.sessionStart) / 1000),
      evolution: getEvolutionStage(this.activityScore),
    };
  }

  /** Tear down all listeners and timers. */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    if (this.sessionTimer) { clearInterval(this.sessionTimer); }
    this.removeAllListeners();
  }

  // ─── Event Registration ──────────────────────────────────────────────────────

  private _registerListeners(): void {

    // ── Text document change → typing activity ────────────────────────────
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        if (e.contentChanges.length === 0) { return; } // ignore meta events
        this._onTyping();
      })
    );

    // ── Save → positive signal or check errors ────────────────────────────
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(_doc => {
        this._onSave();
      })
    );

    // ── Open document → mild activity burst ───────────────────────────────
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(_doc => {
        this._onFileOpen();
      })
    );

    // ── Diagnostics change → error detection ─────────────────────────────
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics(event => {
        this._onDiagnosticsChange(event.uris);
      })
    );

    // ── Terminal task end → attempt victory detection ─────────────────────
    this.disposables.push(
      vscode.tasks.onDidEndTaskProcess(e => {
        if (e.exitCode === 0) {
          this.triggerVictory();
        }
      })
    );
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  private _onTyping(): void {
    this.activityScore += SCORE.type;
    this._touch();

    // Only switch to typing mood if we're idle or alert
    if (this.mood === 'idle' || this.mood === 'alert') {
      this._setMood('typing');
    }
  }

  private _onSave(): void {
    this.activityScore += SCORE.save;
    this._touch();
    this.cleanSaves++;

    // Check current error state
    const totalErrors = this._countAllErrors();

    if (totalErrors === 0) {
      // Clean save
      if (this.mood === 'angry' && this.cleanSaves >= ANGER_COOL_SAVES) {
        this._setMood('happy');
      } else if (this.mood !== 'angry') {
        this._setMood('happy');
      }
      // Happy is brief – return to typing after 2.5 s
      setTimeout(() => {
        if (this.mood === 'happy') { this._setMood('typing'); }
      }, 2500);
    } else {
      this.cleanSaves = 0;
      this._setMood('angry');
    }
  }

  private _onFileOpen(): void {
    this.activityScore += SCORE.open;
    this._touch();
    if (this.mood === 'idle') {
      this._setMood('alert');
      setTimeout(() => {
        if (this.mood === 'alert') { this._setMood('idle'); }
      }, 2000);
    }
  }

  private _onDiagnosticsChange(uris: readonly vscode.Uri[]): void {
    let totalErrors = 0;
    for (const uri of uris) {
      const diags = vscode.languages.getDiagnostics(uri);
      totalErrors += diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
    }
    this.errorCount = this._countAllErrors();

    if (this.errorCount > 0 && this.mood !== 'angry') {
      this._setMood('angry');
    } else if (this.errorCount === 0 && this.mood === 'angry') {
      this._setMood('idle');
    }
  }

  // ─── Sleep Timer ──────────────────────────────────────────────────────────

  private _touch(): void {
    this.lastActivityTime = Date.now();
  }

  // ─── Session Timer (emits every 10 s to update session clock in UI) ───────

  private _startSessionTimer(): void {
    this.sessionTimer = setInterval(() => {
      // Re-emit state so the UI clock stays fresh even without activity
      this._emit();
    }, 10_000);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _setMood(mood: MoodState): void {
    if (this.mood === mood) { return; }
    this.mood = mood;
    this._emit();
  }

  private _emit(): void {
    this.emit('stateChange', this.getState());
  }

  /** Count total error diagnostics across all open files. */
  private _countAllErrors(): number {
    let count = 0;
    const allDiags = vscode.languages.getDiagnostics();
    for (const [, diags] of allDiags) {
      count += diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
    }
    return count;
  }
}
