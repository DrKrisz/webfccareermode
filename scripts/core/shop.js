import { shopItems } from "../data/shop-items.js";
import { formatCurrency } from "./format.js";

export function availableShopItems(state) {
  return shopItems.map((item) => ({
    ...item,
    owned: Boolean(state.player.inventory[item.id]),
    priceLabel: formatCurrency(item.price)
  }));
}

export function canPurchase(state, item) {
  if (state.player.inventory[item.id]) return false;
  return state.player.balance >= item.price;
}

export function purchaseItem(state, item) {
  if (!canPurchase(state, item)) {
    throw new Error("Insufficient balance or already owned.");
  }
  state.player.balance -= item.price;
  state.player.inventory[item.id] = true;

  if (item.effect.recoveryBonus) state.player.perks.recoveryBonus += item.effect.recoveryBonus;
  if (item.effect.trainingBonus) state.player.perks.trainingBonus += item.effect.trainingBonus;
  if (item.effect.reputationBonus) state.player.perks.reputationBonus += item.effect.reputationBonus;
  if (item.effect.fatigueReduction) state.player.perks.fatigueReduction += item.effect.fatigueReduction;

  state.eventLog.unshift({
    id: crypto.randomUUID(),
    date: new Date(state.currentDate),
    message: `${state.player.name} purchased ${item.name}.`
  });
}
