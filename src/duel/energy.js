// Current MAIN RUN budget; the isolated defense experiment keeps its 3/4 budget.
export const V10_ENERGY_BASE=2;
export const V10_ENERGY_MAX=3;
export const v10EnergyBase=state=>state?.defenseLab?.schema===1?3:V10_ENERGY_BASE;
export const v10NextEnergyMax=state=>v10EnergyBase(state)+1;
export const v10Energy=state=>Number.isInteger(state?.battle?.energy)?state.battle.energy:
  Math.min(v10EnergyBase(state),[2,3,4].includes(state?.battle?.energyCap)?state.battle.energyCap:v10EnergyBase(state));
// Old saves may be halfway through a 3/4-energy pitch. Preserve that pitch;
// only an actual next-pitch/batter transition applies the new budget.
export const v10EnergyCap=state=>[2,3,4].includes(state?.battle?.energyCap)
  ?state.battle.energyCap:Math.max(v10EnergyBase(state),v10Energy(state));
