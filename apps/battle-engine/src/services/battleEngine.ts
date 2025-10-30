// src/services/battleEngine.ts
import type {
  BattleCardInstance,
  BattleState,
  MoveMessage,
  PlayerState,
  Skill,
  SkillType,
  TurnResult,
} from "../types/battle.js";

/**
 * Lightweight type effectiveness lookup (keeps your mapping from earlier).
 * Values: 2 = strong, 0.5 = weak, 1 = normal
 */
const TYPE_TABLE: Record<string, Record<string, number>> = {
  Lightning: { Lightning: 1, Fire: 1, Grass: 1, Water: 2, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 1, Dragon: 1, Ground: 0.5, Normal: 1 },
  Fire: { Lightning: 1, Fire: 1, Grass: 2, Water: 0.5, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 2, Dragon: 1, Ground: 1, Normal: 1 },
  Grass: { Lightning: 1, Fire: 0.5, Grass: 1, Water: 2, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 1, Dragon: 1, Ground: 1, Normal: 1 },
  Water: { Lightning: 0.5, Fire: 2, Grass: 0.5, Water: 1, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 1, Dragon: 1, Ground: 2, Normal: 1 },
  Psychic: { Lightning: 1, Fire: 1, Grass: 1, Water: 1, Psychic: 1, Fighting: 2, Darkness: 0.5, Steel: 1, Dragon: 1, Ground: 1, Normal: 1 },
  Fighting: { Lightning: 1, Fire: 1, Grass: 1, Water: 1, Psychic: 0.5, Fighting: 1, Darkness: 2, Steel: 1, Dragon: 1, Ground: 1, Normal: 2 },
  Darkness: { Lightning: 1, Fire: 1, Grass: 1, Water: 1, Psychic: 2, Fighting: 0.5, Darkness: 1, Steel: 1, Dragon: 1, Ground: 1, Normal: 1 },
  Steel: { Lightning: 1, Fire: 0.5, Grass: 1, Water: 1, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 1, Dragon: 1, Ground: 2, Normal: 1 },
  Dragon: { Lightning: 1, Fire: 1, Grass: 1, Water: 1, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 1, Dragon: 2, Ground: 1, Normal: 1 },
  Ground: { Lightning: 2, Fire: 1, Grass: 1, Water: 0.5, Psychic: 1, Fighting: 1, Darkness: 1, Steel: 0.5, Dragon: 1, Ground: 1, Normal: 1 },
  Normal: { Lightning: 1, Fire: 1, Grass: 1, Water: 1, Psychic: 1, Fighting: 0.5, Darkness: 1, Steel: 1, Dragon: 1, Ground: 1, Normal: 1 },
};

function typeMultiplier(attacker: string, defender: string) {
  const row = TYPE_TABLE[attacker] ?? {};
  const m = row[defender];
  return typeof m === "number" ? m : 1;
}

/**
 * Runtime metadata attached to cards (not persisted).
 * Structure placed on card as (card as any)._meta
 */
type CardMeta = { cooldowns: Record<string, number>; defenseBuffer: number };

function ensureMeta(card: BattleCardInstance): CardMeta {
  if (!(card as any)._meta) (card as any)._meta = { cooldowns: {}, defenseBuffer: 0 };
  return (card as any)._meta as CardMeta;
}

export class BattleEngine {
  private static _instance: BattleEngine | null = null;
  private constructor() {}
  public static get instance() {
    if (!this._instance) this._instance = new BattleEngine();
    return this._instance;
  }

  /**
   * applyMove mutates state in-place and returns TurnResult
   */
  public applyMove(state: BattleState, moveMsg: MoveMessage): TurnResult {
    if (!state) throw new Error("Missing state");
    if (state.isFinished) throw new Error("Battle already finished");
    if (!moveMsg || moveMsg.type !== "move") throw new Error("Invalid move");

    const playerWallet = moveMsg.playerWallet;
    if (playerWallet !== state.player1.wallet && playerWallet !== state.player2.wallet) {
      throw new Error("Player not in battle");
    }

    if (state.turnOwner !== playerWallet) throw new Error("Not your turn");

    const isP1 = playerWallet === state.player1.wallet;
    const attackerPlayer = isP1 ? state.player1 : state.player2;
    const defenderPlayer = isP1 ? state.player2 : state.player1;

    const attackerCard = this.getActiveCard(attackerPlayer);
    const defenderCard = this.getActiveCard(defenderPlayer);

    if (attackerCard.currentHp <= 0) throw new Error("Active attacker card is fainted");
    if (defenderCard.currentHp <= 0) throw new Error("Active defender card is fainted");

    const aMeta = ensureMeta(attackerCard);
    const dMeta = ensureMeta(defenderCard);

    // Decrement cooldowns for attacker's active card at start of their turn
    this.decrementCooldowns(aMeta);

    const action = moveMsg.move.action as SkillType;
    const skillName = moveMsg.move.skillName;
    const target = moveMsg.move.target;

    // Validate skill presence for attack/defense/heal
    let skill: Skill | undefined;
    if (action === "attack" || action === "defense" || action === "heal") {
      if (!skillName) throw new Error(`${action} requires skillName`);
      skill = this.findSkill(attackerCard, skillName);
      if (!skill) throw new Error(`Skill ${skillName} not found`);
      if (skill.type !== action) throw new Error(`Skill ${skillName} is not type ${action}`);
      // cooldown check
      const rem = aMeta.cooldowns[skill.name] ?? 0;
      if (rem > 0) throw new Error(`Skill ${skill.name} on cooldown (${rem})`);
    }

    // result placeholders
    let damageDealt = 0;
    let swapTo: string | undefined = undefined;

    // Apply actions
    if (action === "attack") {
      // damage = floor(skill.power * typeMultiplier) - defenseBuffer
      const multiplier = typeMultiplier(attackerCard.elementType, defenderCard.elementType);
      const base = Math.max(0, Math.floor(skill!.power));
      const raw = Math.floor(base * multiplier);
      const defenseBuffer = Math.floor(dMeta.defenseBuffer ?? 0);
      const effective = Math.max(0, raw - defenseBuffer);
      damageDealt = Math.min(effective, defenderCard.currentHp);
      defenderCard.currentHp = Math.max(0, defenderCard.currentHp - damageDealt);
      // consume defense buffer
      dMeta.defenseBuffer = 0;
      // set cooldown
      if (skill!.cooldown && skill!.cooldown > 0) aMeta.cooldowns[skill!.name] = skill!.cooldown;
    } else if (action === "defense") {
      const boost = Math.max(0, Math.floor(skill!.power));
      aMeta.defenseBuffer = (aMeta.defenseBuffer ?? 0) + boost;
      if (skill!.cooldown && skill!.cooldown > 0) aMeta.cooldowns[skill!.name] = skill!.cooldown;
    } else if (action === "heal") {
      const heal = Math.max(0, Math.floor(skill!.power));
      attackerCard.currentHp = Math.min(attackerCard.baseHp, attackerCard.currentHp + heal);
      if (skill!.cooldown && skill!.cooldown > 0) aMeta.cooldowns[skill!.name] = skill!.cooldown;
    } else if (action === "swap") {
      if (!target) throw new Error("swap requires target instanceId");
      swapTo = target;
      const ok = this.performSwap(attackerPlayer, target);
      if (!ok) throw new Error("Invalid swap target");
    } else {
      throw new Error("Unknown action");
    }

    // Compose TurnResult
    const result: TurnResult = {
      turnNumber: state.turnNumber,
      attacker: attackerPlayer.wallet,
      defender: defenderPlayer.wallet,
      action,
      skillName,
      damageDealt,
      dotDamage: [],
      statusApplied: [],
      swapTo,
      attackerCardId: attackerPlayer.activeCard.instanceId,
      defenderCardId: defenderPlayer.activeCard.instanceId,
      attackerHpAfter: attackerPlayer.activeCard.currentHp,
      defenderHpAfter: defenderPlayer.activeCard.currentHp,
      winner: undefined,
    };

    // Advance turn & update metadata
    state.turnNumber = (state.turnNumber ?? 1) + 1;
    state.turnOwner = this.nextTurnOwner(state);

    // Check winner: if opponent has all cards dead -> attacker wins
    const winner = this.checkWinner(state);
    if (winner) {
      state.isFinished = true;
      state.winner = winner;
      result.winner = winner;
    }

    // Append to log, update timestamp
    state.battleLog = state.battleLog ?? [];
    state.battleLog.push(result);
    state.updatedAt = Date.now();

    return result;
  }

  private getActiveCard(player: PlayerState): BattleCardInstance {
    if (!player.activeCard || !player.activeCard.instanceId) throw new Error("Active card not set");
    // prefer the card object from deck so changes persist on deck too
    const found = player.deck.find((c) => c.instanceId === player.activeCard.instanceId);
    if (found) return found;
    // fallback: return activeCard object (should not happen if deck kept consistent)
    return player.activeCard;
  }

  private findSkill(card: BattleCardInstance, skillName: string): Skill {
    const s = card.skills.find((sk) => sk.name === skillName);
    if (!s) throw new Error(`Skill ${skillName} not found on card ${card.name}`);
    return s;
  }

  private performSwap(player: PlayerState, targetId: string): boolean {
    if (player.activeCard.instanceId === targetId) return false;
    const target = player.deck.find((c) => c.instanceId === targetId);
    if (!target) return false;
    if ((target.currentHp ?? 0) <= 0) return false; // cannot swap to fainted
    const prev = player.activeCard;
    // remove target from deck and add prev into deck if not present
    player.deck = player.deck.filter((c) => c.instanceId !== targetId);
    if (!player.deck.find((c) => c.instanceId === prev.instanceId)) player.deck.push(prev);
    player.activeCard = target;
    return true;
  }

  private decrementCooldowns(meta: CardMeta) {
    if (!meta || !meta.cooldowns) return;
    for (const k of Object.keys(meta.cooldowns)) {
      const v = meta.cooldowns[k];
      if (!v || v <= 1) delete meta.cooldowns[k];
      else meta.cooldowns[k] = v - 1;
    }
  }

  private nextTurnOwner(state: BattleState) {
    return state.turnOwner === state.player1.wallet ? state.player2.wallet : state.player1.wallet;
  }

  private isAllCardsDead(player: PlayerState) {
    const anyAlive = player.deck.some((c) => (c.currentHp ?? 0) > 0) || (player.activeCard.currentHp ?? 0) > 0;
    return !anyAlive;
  }

  private checkWinner(state: BattleState): string | undefined {
    const p1Alive = !this.isAllCardsDead(state.player1);
    const p2Alive = !this.isAllCardsDead(state.player2);
    if (!p1Alive && !p2Alive) return "draw";
    if (!p1Alive) return state.player2.wallet;
    if (!p2Alive) return state.player1.wallet;
    return undefined;
  }
}

export default BattleEngine.instance;
