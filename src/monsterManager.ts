/**
 * monsterManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines all six Monsterverse creatures, their personality traits, evolution
 * thresholds, animation states, and their PNG image paths.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type MonsterId = 'godzilla' | 'ghidorah' | 'kong' | 'rodan' | 'mechagodzilla' | 'muto' | 'scylla';
export type MoodState = 'idle' | 'happy' | 'angry' | 'victory' | 'alert' | 'typing';
export type EvolutionStage = 'base' | 'energized' | 'alpha';

export interface MonsterStateMessage {
  type: 'UPDATE_STATE';
  monster: MonsterId;
  mood: MoodState;
  evolution: EvolutionStage;
  activityScore: number;
  errorCount: number;
  sessionTime: number;
  message: string;
}

export interface MonsterPersonality {
  id: MonsterId;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  tagline: string;
  moodMessages: Record<MoodState, string[]>;
  animationSpeed: number;
  jitterIntensity: 'low' | 'medium' | 'high' | 'extreme';
  imagePath: string; // Changed from svgProfile to imagePath
  angerThreshold: number;

  isFlyer?: boolean;
}

export const EVOLUTION_THRESHOLDS = {
  base: 0,
  energized: 150,
  alpha: 500,
} as const;

export function getEvolutionStage(activityScore: number): EvolutionStage {
  if (activityScore >= EVOLUTION_THRESHOLDS.alpha) { return 'alpha'; }
  if (activityScore >= EVOLUTION_THRESHOLDS.energized) { return 'energized'; }
  return 'base';
}

export const MONSTERS: Record<MonsterId, MonsterPersonality> = {

  godzilla: {
    id: 'godzilla',
    displayName: 'Godzilla',
    primaryColor: '#2b2e33',
    secondaryColor: '#1a1c20',
    accentColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    tagline: 'King of the Monsters',
    animationSpeed: 0.6,
    jitterIntensity: 'low',
    angerThreshold: 1.8,

    imagePath: 'monsters/godzilla_spritesheet.png',
    moodMessages: {
      idle: ['...', 'The Alpha observes.', 'Atomic silence.', 'Staring down the code.'],
      happy: ['SKREEEONK!', 'Nature brings balance.', 'Atomic pulse!', 'A worthy build.'],
      angry: ['RAAWR!', 'Errors disrupt the balance.', 'Atomic breath charging...', 'Unacceptable.'],

      victory: ['SKREEEONK!!!', 'LONG LIVE THE KING!', 'Absolute dominance.', 'Victory roar!'],
      alert: ['Something stirs...', 'Titan detected.', 'Dorsal fins glowing...'],
      typing: ['Keystroke by keystroke...', 'Building...', 'Watching.'],
    },
  },

  kong: {
    id: 'kong',
    displayName: 'Kong',
    primaryColor: '#3a2b25',
    secondaryColor: '#201612',
    accentColor: '#ffb700',
    glowColor: 'rgba(255, 183, 0, 0.6)',
    tagline: 'King of Skull Island',
    animationSpeed: 1.4,
    jitterIntensity: 'high',
    angerThreshold: 0.9,

    imagePath: 'monsters/kong_spritesheet.png',
    moodMessages: {
      idle: ['*grunt*', 'Watching...', 'Skull Island calm.', '...'],
      happy: ['ROAAAR!', 'KONG APPROVES!', '*chest pound*', 'YES! YES! YES!'],
      angry: ['RAAAAGH!', '*beats chest furiously*', 'KONG ANGRY!', 'FIX BUGS NOW!!!'],

      victory: ['KONG WINS!!!', '*massive chest pound*', 'ALPHA!', 'ROOOOOAR!!!'],
      alert: ['*sniffs air*', 'Something wrong...', '*stands tall*'],
      typing: ['*watches fingers*', 'tap tap tap...', 'Kong sees.'],
    },
  },

  ghidorah: {
    id: 'ghidorah',
    displayName: 'King Ghidorah',
    primaryColor: '#cda434',
    secondaryColor: '#8a6e23',
    accentColor: '#ffee00',
    glowColor: 'rgba(255, 238, 0, 0.7)',
    tagline: 'The False King',
    animationSpeed: 1.1,
    jitterIntensity: 'extreme',
    angerThreshold: 0.6,

    imagePath: 'monsters/ghidorah_spritesheet.png',
    isFlyer: true,
    moodMessages: {
      idle: ['...we watch...', 'Three minds as one.', 'The void awaits.', '*static*'],
      happy: ['VICTORY!', 'Chaos yields order!', 'ALL THREE AGREE!', 'SCREEEEE!'],
      angry: ['DESTROY!!!', 'ERRORS! CHAOS! RUIN!', 'LIGHTNING STRIKE!', 'ALL WILL BURN!'],

      victory: ['WE ARE SUPREME!', 'BOW TO GHIDORAH!', 'SCREEEEEEE!!!', 'CHAOS WINS!'],
      alert: ['*static crackle*', 'We sense disturbance.', 'Three heads turn...'],
      typing: ['*three heads watch*', 'We observe your keystrokes.', '...interesting...'],
    },
  },

  rodan: {
    id: 'rodan',
    displayName: 'Rodan',
    primaryColor: '#5c1a1a',
    secondaryColor: '#3d1111',
    accentColor: '#ff4400',
    glowColor: 'rgba(255, 68, 0, 0.6)',
    tagline: 'The Fire Demon',
    animationSpeed: 2.0,
    jitterIntensity: 'high',
    angerThreshold: 0.7,

    imagePath: 'monsters/rodan_spritesheet.png',
    isFlyer: true,
    moodMessages: {
      idle: ['*wind rush*', 'Scanning horizon...', 'Alert. Always alert.', '*wing rustle*'],
      happy: ['SCREEEECH!', 'Thermal rising!', 'FAST! FAST! FAST!', 'RODAN SOARS!'],
      angry: ['SCREEEE!', 'FIRE DEMON WAKES!', 'YOU WILL BURN!', 'FASTER! NO ERRORS!'],

      victory: ['SCREEEEE!!!', 'KING OF THE SKY!', 'FIRE VICTORY!', 'RODAN WINS!'],
      alert: ['*snaps to attention*', 'Movement detected!', 'WINGS READY!'],
      typing: ['*rapid wing beats*', 'So fast! So fast!', 'Every keystroke counts!'],
    },
  },

  mechagodzilla: {
    id: 'mechagodzilla',
    displayName: 'Mechagodzilla',
    primaryColor: '#7a7a7a',
    secondaryColor: '#404040',
    accentColor: '#ff0000',
    glowColor: 'rgba(255, 0, 0, 0.6)',
    tagline: 'The Apex Predator',
    animationSpeed: 1.0,
    jitterIntensity: 'low',
    angerThreshold: 0.8,

    imagePath: 'monsters/mechagodzilla_spritesheet.png',
    moodMessages: {
      idle: ['*mechanical whir*', 'Systems nominal.', 'Scanning code...', 'Efficiency at 98%.'],
      happy: ['OPTIMIZATION COMPLETE.', 'NO ERRORS DETECTED.', 'SUPERIOR CODE.', 'AFFIRMATIVE.'],
      angry: ['ERRORS DETECTED.', 'EXTERMINATE BUGS.', 'SYSTEM MALFUNCTION.', 'PROCEED TO ELIMINATE.'],

      victory: ['APEX CODE ACHIEVED.', 'ALL TASKS COMPLETE.', 'VICTORY SECURED.'],
      alert: ['WARNING. ANOMALY.', 'SENSORS TRIGGERED.', 'THREAT LEVEL INCREASING.'],
      typing: ['PROCESSING INPUT...', 'Calculating keystrokes...', 'Data receiving...'],
    },
  },

  muto: {
    id: 'muto',
    displayName: 'MUTO',
    primaryColor: '#1a1a1a',
    secondaryColor: '#0a0a0a',
    accentColor: '#ff0033',
    glowColor: 'rgba(255, 0, 51, 0.6)',
    tagline: 'The Parasite',
    animationSpeed: 1.5,
    jitterIntensity: 'high',
    angerThreshold: 0.6,

    imagePath: 'monsters/muto_spritesheet.png',
    moodMessages: {
      idle: ['*clicking sounds*', 'Seeking energy...', 'Radiation levels optimal.', '...'],
      happy: ['*EMP hums*', 'ENERGY SECURED.', 'FEEDING COMPLETE.', 'GROWTH PROGRESSING.'],
      angry: ['*screech*', 'ENERGY DEPLETED!', 'NETWORK DISRUPTED!', 'ATTACK!'],

      victory: ['*triumphant roar*', 'PULSE COMPLETE.', 'ALL ENERGY DRAINED.'],
      alert: ['*antenna twitch*', 'Energy spike detected.', 'PREY NEAR.'],
      typing: ['*rapid clicking*', 'Interfering with signals...', 'Monitoring.'],
    },
  },

  scylla: {
    id: 'scylla',
    displayName: 'Scylla',
    primaryColor: '#2b221e',
    secondaryColor: '#1a1411',
    accentColor: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.6)',
    tagline: 'The Ice Titan',
    animationSpeed: 1.2,
    jitterIntensity: 'medium',
    angerThreshold: 0.8,

    imagePath: 'monsters/scylla_spritesheet.png',
    moodMessages: {
      idle: ['*chitter*', 'Freezing the environment...', 'Scuttling around.', 'Cold is good.'],
      happy: ['*happy clicks*', 'ICE AGE RETURNS.', 'PERFECT TEMPERATURE.', 'GLACIER SECURED.'],
      angry: ['*hiss*', 'TOO HOT!', 'MELTING AVOIDED!', 'FREEZE THEM ALL!'],

      victory: ['*scuttles rapidly*', 'FROZEN WASTELAND.', 'COLD VICTORY.'],
      alert: ['*legs tense*', 'Heat signature detected.', 'PREPARE TO FREEZE.'],
      typing: ['*tap tap tap*', 'Icy progress...', 'Chilling code.'],
    },
  },
};

export function getRandomMoodMessage(monsterId: MonsterId, mood: MoodState): string {
  const messages = MONSTERS[monsterId].moodMessages[mood];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getMonster(id: MonsterId): MonsterPersonality {
  return MONSTERS[id];
}

export function getAllMonsterIds(): MonsterId[] {
  return Object.keys(MONSTERS) as MonsterId[];
}
