/**
 * commands.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers all VS Code command palette entries for the Monsterverse extension.
 * Each command delegates to callback functions provided by extension.ts so
 * this module stays dependency-free and easily testable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import { MonsterId } from './monsterManager';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandCallbacks {
  selectMonster: (id: MonsterId) => void;
  togglePanel: () => void;
  resetMood: () => void;
  showPanel: () => void;
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Register all Monsterverse commands and return their disposables.
 * Call this once inside `activate()`.
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  callbacks: CommandCallbacks
): void {

  const cmds: Array<[string, () => void]> = [

    // ── Monster selection ──────────────────────────────────────────────────
    [
      'monsterverse.selectGodzilla',
      () => {
        callbacks.selectMonster('godzilla');
        vscode.window.showInformationMessage(
          '🦎 Godzilla awakens! The King of Monsters joins your session.'
        );
      },
    ],
    [
      'monsterverse.selectKong',
      () => {
        callbacks.selectMonster('kong');
        vscode.window.showInformationMessage(
          '🦍 Kong enters! Ruler of Skull Island is watching you code.'
        );
      },
    ],
    [
      'monsterverse.selectGhidorah',
      () => {
        callbacks.selectMonster('ghidorah');
        vscode.window.showInformationMessage(
          '⚡ King Ghidorah descends! Three heads, one chaotic mind.'
        );
      },
    ],
    [
      'monsterverse.selectRodan',
      () => {
        callbacks.selectMonster('rodan');
        vscode.window.showInformationMessage(
          '🔥 Rodan takes flight! The Fire Demon watches your every keystroke.'
        );
      },
    ],
    [
      'monsterverse.selectMechagodzilla',
      () => {
        callbacks.selectMonster('mechagodzilla');
        vscode.window.showInformationMessage(
          '🤖 Mechagodzilla online! Optimizing your code.'
        );
      },
    ],
    [
      'monsterverse.selectMuto',
      () => {
        callbacks.selectMonster('muto');
        vscode.window.showInformationMessage(
          '☢️ MUTO hatches! EMP active.'
        );
      },
    ],
    [
      'monsterverse.selectScylla',
      () => {
        callbacks.selectMonster('scylla');
        vscode.window.showInformationMessage(
          '🕷️ Scylla awakens! Freezing bugs in their tracks.'
        );
      },
    ],

    // ── Panel controls ────────────────────────────────────────────────────
    [
      'monsterverse.togglePanel',
      () => callbacks.togglePanel(),
    ],
    [
      'monsterverse.showPanel',
      () => callbacks.showPanel(),
    ],

    // ── Mood reset ────────────────────────────────────────────────────────
    [
      'monsterverse.resetMood',
      () => {
        callbacks.resetMood();
        vscode.window.showInformationMessage(
          '🔄 Monster mood has been reset to idle.'
        );
      },
    ],
  ];

  // Register every command and push into extension context for cleanup
  for (const [commandId, handler] of cmds) {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, handler)
    );
  }
}
