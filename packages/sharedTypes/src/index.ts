// ------------------------
// Core Types used by battle-engine and apps
// ------------------------

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
  type: SkillType;
  power: number;
  cooldown?: number; // used by battle-engine
}

export interface BattleCardInstance {
  instanceId: string;
  name: string;
  elementType: ElementType;
  baseHp: number;
  currentHp: number;
  skills: Skill[];
}

export interface PlayerState {
  wallet: string;
  deck: BattleCardInstance[];
  activeCard: BattleCardInstance; // expects full card object
}

export interface TurnResult {
  turnNumber: number;
  attacker: string;
  defender: string;
  action: SkillType;
  skillName?: string | undefined;
  damageDealt: number;
  dotDamage?: { target: string; dmg: number; id: string }[] | undefined;
  statusApplied?: any[] | undefined;
  swapTo?: string | undefined;
  attackerCardId: string;
  defenderCardId: string;
  attackerHpAfter: number;
  defenderHpAfter: number;
  winner?: string | undefined;
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
}

export interface MoveMessage {
  type: "move";
  battleId: string;
  playerWallet: string;
  move: {
    action: SkillType;
    skillName?: string;
    target?: string; // instanceId for swap
  };
  nonce: number;
}

// ------------------------
// Domain types used across apps
// ------------------------

export type Rarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "ULTRA_RARE"
  | "DOUBLE_RARE"
  | "ILLUSTRATION_RARE"
  | "HYPER_RARE";

export interface Card {
  id?: string;
  name: string;
  elementType: string;
  currentHp: number;
  metdataUrl: string;
  rarity: Rarity;
  maxSupply?: number;
  currentSupply?: number;
}

export interface UserCard {
  instanceId?: string; // unique per user's card
  owner: string; // wallet address
  cardId: string;
  metadata: string;
  currentHp?: number; // mutable HP for ongoing battles
  isActive: boolean; // used during battle for active card
}

export type EggType =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "CRYSTAL"
  | "MASTER"
  | "CHAMPION"
  | "TITAN"
  | "LEGEND_LEAGUE";

export interface UserEgg {
  id: string;
  userId: string; // wallet address
  type: EggType;
  isHatched: boolean;
  createdAt: number;
}

