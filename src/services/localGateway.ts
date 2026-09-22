import { deckXp, mergeCards, UPGRADE_XP } from '../game/upgrades';
import { BOT_CONFIG, createBotStates, grantBotAugment, type BotStates } from '../game/botAI';
import { createLobby, resolveLobbyRound } from '../game/tournament';
import { offersFor, rerollCost } from '../game/shop';
import { augmentOffers, shopIncome } from '../game/augments';
import { cloneSnapshot } from '../game/clone';
import { spellAddReason, RULES, SPELLS } from '../game/engine';
import type { Command, Difficulty, GameGateway, Session, SpellId } from '../game/model';
// IDs are local-only; a remote adapter receives its IDs from the server.
let nextSessionId = 0;
export class LocalGameGateway implements GameGateway {
    private bots: BotStates = {};
    private session: Session | null = null;
    async start(difficulty: Difficulty = BOT_CONFIG.defaultDifficulty as Difficulty): Promise<Session> {
        if (!Object.prototype.hasOwnProperty.call(BOT_CONFIG.difficulties, difficulty))
            throw new Error('Unknown difficulty.');
        this.session = { difficulty, lobby: createLobby(), id: `local-${++nextSessionId}`, revision: 0, round: 1, gold: RULES.gold, spells: [], spellXp: [], ...offersFor(1, 0), rerolls: 0, augments: [], augmentOffers: [], phase: 'shop', wins: 0, losses: 0, battle: null };
        this.bots = createBotStates(this.session.lobby.players.filter(p => !p.human).map(p => p.id));
        return cloneSnapshot(this.session);
    }
    async execute(id: string, revision: number, command: Command): Promise<Session> {
        if (!this.session || this.session.id !== id)
            throw new Error('Session not found. Start a new run.');
        if (this.session.revision !== revision)
            throw new Error('This action is out of date. Please try again.');
        const s = cloneSnapshot(this.session);
        s.spellXp = deckXp(s.spells, s.spellXp);
        if (s.lobby.finished)
            throw new Error('This game is complete. Start a new game.');
        const enterShop = () => { s.phase = 'shop'; s.round++; s.gold += shopIncome(s.augments); s.battle = null; s.rerolls = 0; s.augmentOffers = []; s.bonusMergeUsed = false; Object.assign(s, offersFor(s.round, 0, s.spells, s.augments)); };
        if (command.type === 'chooseAugment') {
            if (s.phase !== 'augment' || !s.augmentOffers.includes(command.augment) || s.augments.includes(command.augment))
                throw new Error('Augment unavailable.');
            s.augments.push(command.augment);
            s.lobby.players.find(p => p.human)!.augments = [...s.augments];
            enterShop();
        }
        else if (command.type === 'next') {
            if (s.phase !== 'result')
                throw new Error('Finish combat first.');
            if (s.round % RULES.augmentEvery === 0) {
                const bots = cloneSnapshot(this.bots);
                s.lobby.players.forEach((p, i) => { if (!p.human) {
                    grantBotAugment(bots[p.id], p.deck, s.round, i);
                    p.augments = [...bots[p.id].augments];
                } });
                s.augmentOffers = augmentOffers(s.round, s.augments);
                this.bots = bots;
                if (s.augmentOffers.length) {
                    s.phase = 'augment';
                    s.battle = null;
                }
                else
                    enterShop();
            }
            else
                enterShop();
        }
        else {
            if (s.phase !== 'shop')
                throw new Error('Your spell order is locked during combat.');
            if (command.type === 'reroll') {
                const cost = rerollCost(s.augments, s.rerolls);
                if (s.gold < cost)
                    throw new Error('Not enough gold to reroll.');
                s.gold -= cost;
                s.rerolls++;
                Object.assign(s, offersFor(s.round, s.rerolls, s.spells, s.augments));
            }
            else if (command.type === 'buy') {
                const spell = SPELLS[command.spell];
                const shopSlot = command.shopSlot ?? s.shop.indexOf(command.spell);
                if (!spell || !Number.isInteger(shopSlot) || shopSlot < 0 || s.shop[shopSlot] !== command.spell)
                    throw new Error('Spell unavailable.');
                if (command.target === undefined && s.spells.length >= RULES.slots)
                    throw new Error('Your spellbook is full.');
                if (command.target !== undefined && (!Number.isInteger(command.target) || command.target < 0 || s.spells[command.target] !== spell.id || s.spellXp[command.target] >= UPGRADE_XP))
                    throw new Error('Choose a matching card that can gain XP.');
                const addReason = command.target === undefined ? spellAddReason(s.spells, spell.id) : null;
                if (addReason)
                    throw new Error(addReason);
                if (s.gold < spell.price)
                    throw new Error('Not enough gold.');
                s.gold -= spell.price;
                s.shop[shopSlot] = null;
                if (command.target !== undefined) {
                    const bonus = s.augments.includes('scholar') && !s.bonusMergeUsed ? 1 : 0;
                    s.spellXp[command.target] = Math.min(UPGRADE_XP, s.spellXp[command.target] + 1 + bonus);
                    if (bonus)
                        s.bonusMergeUsed = true;
                }
                else {
                    s.spells.push(spell.id);
                    s.spellXp.push(0);
                }
            }
            else if (command.type === 'merge') {
                mergeCards(s.spells, s.spellXp, command.from, command.to);
            }
            else if (command.type === 'trash') {
                if (!Number.isInteger(command.index) || command.index < 0 || command.index >= s.spells.length)
                    throw new Error('Invalid spell position.');
                if (s.augments.includes('recycler'))
                    s.gold++;
                s.spells.splice(command.index, 1);
                s.spellXp.splice(command.index, 1);
            }
            else if (command.type === 'move') {
                const { from, to } = command;
                if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= s.spells.length || to >= s.spells.length)
                    throw new Error('Invalid spell position.');
                const [spell] = s.spells.splice(from, 1);
                s.spells.splice(to, 0, spell);
                const [xp] = s.spellXp.splice(from, 1);
                s.spellXp.splice(to, 0, xp);
            }
            else {
                if (!s.spells.length)
                    throw new Error('Equip a spell first.');
                const bots = cloneSnapshot(this.bots);
                resolveLobbyRound(s, bots);
                this.bots = bots;
            }
        }
        s.revision++;
        this.session = s;
        return cloneSnapshot(s);
    }
}
