// src/types/battle.ts
export type SkillType = "attack" | "defense" | "heal" | "swap";

export type ElementType =
  | "Lightning"
  | "Fire"
  | "Grass"
  | "Water"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Steel"
  | "Dragon"
  | "Ground"
  | "Normal";

export interface Skill {
  name: string;
  type: SkillType; // one of 4
  power: number; // e.g. damage amount or heal amount or defense strength
  cooldown?: number; // optional turns before reuse
}

export interface BattleCardInstance {
  instanceId: string;
  name: string;
  elementType: ElementType;
  baseHp: number;
  currentHp: number;
  skills: Skill[]; // e.g. {name: "ironTail", power: 20, type: "attack"}
  // runtime-only meta (not persisted) may be attached under _meta
}

export interface PlayerState {
  wallet: string;
  deck: BattleCardInstance[]; // all cards including active
  activeCard: BattleCardInstance; // full object (instance must exist in deck)
}

export interface TurnResult {
  turnNumber: number;
  attacker: string;
  defender: string;
  action: SkillType;
  skillName?: string;
  damageDealt: number;
  dotDamage?: { target: string; dmg: number; id: string }[];
  statusApplied?: any[];
  swapTo?: string;
  attackerCardId: string;
  defenderCardId: string;
  attackerHpAfter: number;
  defenderHpAfter: number;
  winner?: string;
}

export interface BattleState {
  battleId: string;
  player1: PlayerState;
  player2: PlayerState;
  turnOwner: string;
  turnNumber: number;
  battleLog: TurnResult[];
  isFinished: boolean;
  winner?: string;
  createdAt: number;
  updatedAt: number;
  stake?: number;
}

export interface MoveMessage {
  type: "move";
  battleId: string;
  playerWallet: string;
  move: {
    action: SkillType;
    skillName?: string;
    target?: string; // swap target instanceId
  };
  nonce?: number;
}
