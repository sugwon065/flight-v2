let rangeTutorialShown = false

export const shouldShowRangeTutorial = () => !rangeTutorialShown
export const markRangeTutorialShown = () => { rangeTutorialShown = true }

export function resetVisitState() {
  rangeTutorialShown = false
  try { window.localStorage.removeItem('skyfinder-range-tutorial-v1') }
  catch { /* The current visit does not rely on browser storage. */ }
}
