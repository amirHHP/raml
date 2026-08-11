import { useEffect, useRef, useState } from 'react';
import { audioEngine, type AudioSettings, type BgmTrack } from '../utils/audioEngine';
import type { EnemyLineArtType, GameState, TabId } from '../types/game';

const COMBAT_ENEMIES: EnemyLineArtType[] = [
  'orc_guardian',
  'dragon',
  'skeleton',
  'shadow',
  'boss_demon',
  'wolf',
];

const MYSTERY_PRESETS: EnemyLineArtType[] = [
  'magic_portal',
  'ruined_altar',
  'phoenix',
  'ancient_tree',
];

export function useAudioEngine(state: GameState | null, tab: TabId) {
  const [settings, setSettings] = useState<AudioSettings>(() =>
    audioEngine.getSettings(),
  );

  const prevLocationRef = useRef<string | null>(null);
  const prevEnemyRef = useRef<EnemyLineArtType | null>(null);
  const prevInvCountRef = useRef<number>(0);
  const prevAtHomeRef = useRef<boolean>(false);
  const prevRollCountRef = useRef<number>(0);

  // Subscribe to settings changes
  useEffect(() => {
    return audioEngine.subscribe(setSettings);
  }, []);

  // Unlock web audio on first user touch/click anywhere on page
  useEffect(() => {
    const handleUserInteraction = () => {
      audioEngine.resumeContext();
    };

    window.addEventListener('pointerdown', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Sync background music and trigger event sound effects based on game state updates
  useEffect(() => {
    if (!state || !state.awakened) {
      audioEngine.playTrack('none');
      return;
    }

    const {
      currentLocation,
      enemyLineArtType,
      inventory,
      atHome,
      lastRoll,
    } = state;

    // 1. DETERMINE & PLAY BGM TRACK
    let targetTrack: BgmTrack = 'exploration';

    if (atHome || tab === 'home') {
      targetTrack = 'home';
    } else if (COMBAT_ENEMIES.includes(enemyLineArtType)) {
      targetTrack = 'combat';
    } else if (MYSTERY_PRESETS.includes(enemyLineArtType)) {
      targetTrack = 'mystery';
    } else {
      targetTrack = 'exploration';
    }

    audioEngine.playTrack(targetTrack);

    // 2. DETECT EVENT SOUND EFFECTS (SFX)

    // Entering Home / Shelter
    if (prevAtHomeRef.current !== undefined && !prevAtHomeRef.current && atHome) {
      audioEngine.playSfx('home');
    }

    // New Location
    if (
      prevLocationRef.current !== null &&
      prevLocationRef.current !== currentLocation &&
      currentLocation
    ) {
      audioEngine.playSfx('location');
    }

    // Combat Enemy Attack Encounter
    if (
      prevEnemyRef.current !== null &&
      !COMBAT_ENEMIES.includes(prevEnemyRef.current) &&
      COMBAT_ENEMIES.includes(enemyLineArtType)
    ) {
      audioEngine.playSfx('combat');
    }

    // Finding Item / Opening Chest / Looting
    const invCount = inventory ? inventory.length : 0;
    if (
      (prevEnemyRef.current !== 'chest' && enemyLineArtType === 'chest') ||
      (prevInvCountRef.current > 0 && invCount > prevInvCountRef.current)
    ) {
      audioEngine.playSfx('item');
    }

    // Dice Roll Event
    if (lastRoll && lastRoll.total !== prevRollCountRef.current) {
      audioEngine.playSfx('dice');
      prevRollCountRef.current = lastRoll.total;
    }

    // Update refs for next diff
    prevLocationRef.current = currentLocation;
    prevEnemyRef.current = enemyLineArtType;
    prevInvCountRef.current = invCount;
    prevAtHomeRef.current = Boolean(atHome);
  }, [state, tab]);

  return {
    settings,
    toggleBgm: () => audioEngine.toggleBgm(),
    toggleSfx: () => audioEngine.toggleSfx(),
    setBgmVolume: (v: number) => audioEngine.setBgmVolume(v),
    setSfxVolume: (v: number) => audioEngine.setSfxVolume(v),
    playSfx: (sfx: Parameters<typeof audioEngine.playSfx>[0]) => audioEngine.playSfx(sfx),
  };
}
