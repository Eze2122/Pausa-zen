export type Lang = "es" | "en";

export function deviceLang(): Lang {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || "en";
    return loc.toLowerCase().startsWith("es") ? "es" : "en";
  } catch {
    return "en";
  }
}

const es = {
  subtitle: "Minijuegos antiestrés",
  play: "JUGAR", collection: "COLECCIÓN", favorites: "FAVORITOS", challenges: "RETOS", settings: "AJUSTES",
  freeMode: "Modo libre", relaxMode: "Modo relajación", challengeMode: "Modo reto",
  freeDesc: "Sin tiempo ni vidas", relaxDesc: "Sin prisa, sin anuncios", challengeDesc: "Objetivo, tiempo y vidas",
  level: "Nivel", nextLife: "Próxima vida en", livesFull: "Vidas completas", recent: "Continuar jugando", worlds: "Mundos",
  w1: "Burbujas y Pop", w2: "Colores y Formas", w3: "Arena y Texturas", w4: "Movimiento y Equilibrio", w5: "Minipuzles Relajantes",
  map: "Mapa", stars: "estrellas", locked: "Bloqueado", unlockHint: "Consigue {n} estrellas en el mundo anterior",
  goal: "Objetivo", time: "Tiempo", score: "Puntos", start: "EMPEZAR", exit: "Salir", restart: "Reiniciar", resume: "CONTINUAR",
  paused: "Pausa", finish: "Terminar", again: "OTRA VEZ", next: "SIGUIENTE", toMap: "VOLVER AL MAPA", won: "¡Reto superado!",
  lost: "¡Casi!", done: "¡Bien hecho!", lifeLost: "Has perdido una vida", xp: "XP", coins: "Monedas",
  noLivesTitle: "¡Sin vidas!", noLivesBody: "Tus vidas se recuperan solas, aunque cierres la app.",
  watchAd: "VER ANUNCIO Y RECUPERAR VIDA", getFreeLife: "CONSEGUIR 1 VIDA GRATIS", keepRelax: "SEGUIR EN MODO RELAJACIÓN",
  adsLeft: "Recompensas de hoy: {n}/5", adNoNet: "Sin conexión. Puedes esperar a la recuperación automática.",
  adUnavailable: "No hay anuncios disponibles ahora. Puedes esperar a la recuperación automática.",
  adNotDone: "El anuncio no se completó. No se concedió la vida.", adLimit: "Has usado las 5 recompensas de hoy.",
  adOk: "¡+1 vida!", adLoading: "Cargando anuncio...", livesMax: "Ya tienes 5/5 vidas.",
  needLives: "Los retos usan vidas. El modo libre y relajación siempre están disponibles.",
  favEmpty: "Aún no tienes favoritos. Toca el corazón de cualquier minijuego.",
  all: "Todos", daily: "Objetivos diarios", claim: "RECLAMAR", claimed: "Reclamado", achievements: "Logros", stats: "Estadísticas",
  streak: "Racha", days: "días", plays: "Partidas", wins: "Retos ganados", totalStars: "Estrellas", playTime: "Tiempo jugado",
  goal_play: "Juega {n} partidas", goal_stars: "Gana {n} estrellas", goal_win: "Supera {n} retos", goal_relax: "Juega {n} veces en relajación",
  ach_first: "Primera pausa", ach_ten: "10 partidas", ach_fifty: "50 partidas", ach_stars25: "25 estrellas", ach_stars100: "100 estrellas",
  ach_win5: "5 retos superados", ach_level5: "Nivel 5", ach_worlds: "Visitaste los 5 mundos", ach_explorer: "Probaste los 50 juegos", ach_streak3: "Racha de 3 días",
  backgrounds: "Fondos", characters: "Personajes", effects: "Efectos", equip: "USAR", equipped: "En uso", buy: "Comprar",
  needLevel: "Nivel {n}", notEnough: "Monedas insuficientes", coinsNote: "Las monedas son virtuales y no tienen valor monetario.",
  language: "Idioma", music: "Música ambiental", sfx: "Efectos de sonido", vibration: "Vibración", volume: "Volumen",
  reduceMotion: "Reducir animaciones", largeText: "Texto grande", premium: "Premium sin anuncios",
  premiumDesc: "Pago único que elimina banners e intersticiales.", buyPremium: "ELIMINAR ANUNCIOS", restore: "Restaurar compra",
  premiumActive: "Premium activo: sin anuncios", premiumUnavailable: "Las compras solo están disponibles en la app instalada desde Google Play.",
  privacy: "Privacidad", privacyText: "PAUSA guarda tu progreso solo en este teléfono. No pedimos registro. Los anuncios de Google AdMob pueden usar identificadores del dispositivo según tu consentimiento.",
  resetProgress: "Borrar progreso", resetConfirm: "Toca de nuevo para confirmar", rules: "Cómo se juega",
  free: "Libre", relax: "Relajación", challenge: "Reto", soundOn: "Sonido activado", soundOff: "Sonido desactivado",
  empty: "Vaciar", playMelody: "Reproducir", clear: "Borrar", target: "Objetivo", discovered: "Descubiertos",
  attract: "Atraer", repel: "Repeler", rake: "Rastrillo", stone: "Piedra", plant: "Planta", ripple: "Ondas", match: "¡Igual!",
  newBest: "¡Nuevo récord!", unlocked: "¡Desbloqueado!", levelUp: "¡Subiste de nivel!", allGames: "50 minijuegos",
  failed: "¡Fallo!", tryAgain: "Inténtalo de nuevo", similarity: "Parecido",
};

const en: typeof es = {
  subtitle: "Anti-stress minigames",
  play: "PLAY", collection: "COLLECTION", favorites: "FAVORITES", challenges: "GOALS", settings: "SETTINGS",
  freeMode: "Free mode", relaxMode: "Relax mode", challengeMode: "Challenge mode",
  freeDesc: "No timer, no lives", relaxDesc: "No rush, no ads", challengeDesc: "Goal, timer and lives",
  level: "Level", nextLife: "Next life in", livesFull: "Lives full", recent: "Keep playing", worlds: "Worlds",
  w1: "Bubbles & Pop", w2: "Colors & Shapes", w3: "Sand & Textures", w4: "Motion & Balance", w5: "Relaxing Mini Puzzles",
  map: "Map", stars: "stars", locked: "Locked", unlockHint: "Earn {n} stars in the previous world",
  goal: "Goal", time: "Time", score: "Score", start: "START", exit: "Exit", restart: "Restart", resume: "RESUME",
  paused: "Paused", finish: "Finish", again: "AGAIN", next: "NEXT", toMap: "BACK TO MAP", won: "Challenge complete!",
  lost: "So close!", done: "Well done!", lifeLost: "You lost a life", xp: "XP", coins: "Coins",
  noLivesTitle: "Out of lives!", noLivesBody: "Lives refill by themselves, even with the app closed.",
  watchAd: "WATCH AD TO GET A LIFE", getFreeLife: "GET 1 FREE LIFE", keepRelax: "KEEP PLAYING IN RELAX MODE",
  adsLeft: "Rewards today: {n}/5", adNoNet: "No connection. You can wait for the automatic refill.",
  adUnavailable: "No ads available right now. You can wait for the automatic refill.",
  adNotDone: "The ad was not completed. No life granted.", adLimit: "You used all 5 rewards today.",
  adOk: "+1 life!", adLoading: "Loading ad...", livesMax: "You already have 5/5 lives.",
  needLives: "Challenges use lives. Free and relax modes are always available.",
  favEmpty: "No favorites yet. Tap the heart on any minigame.",
  all: "All", daily: "Daily goals", claim: "CLAIM", claimed: "Claimed", achievements: "Achievements", stats: "Statistics",
  streak: "Streak", days: "days", plays: "Games", wins: "Challenges won", totalStars: "Stars", playTime: "Play time",
  goal_play: "Play {n} games", goal_stars: "Earn {n} stars", goal_win: "Win {n} challenges", goal_relax: "Play {n} times in relax",
  ach_first: "First pause", ach_ten: "10 games", ach_fifty: "50 games", ach_stars25: "25 stars", ach_stars100: "100 stars",
  ach_win5: "5 challenges won", ach_level5: "Level 5", ach_worlds: "Visited all 5 worlds", ach_explorer: "Tried all 50 games", ach_streak3: "3-day streak",
  backgrounds: "Backgrounds", characters: "Characters", effects: "Effects", equip: "USE", equipped: "In use", buy: "Buy",
  needLevel: "Level {n}", notEnough: "Not enough coins", coinsNote: "Coins are virtual and have no monetary value.",
  language: "Language", music: "Ambient music", sfx: "Sound effects", vibration: "Vibration", volume: "Volume",
  reduceMotion: "Reduce motion", largeText: "Large text", premium: "Premium, no ads",
  premiumDesc: "One-time purchase that removes banners and interstitials.", buyPremium: "REMOVE ADS", restore: "Restore purchase",
  premiumActive: "Premium active: no ads", premiumUnavailable: "Purchases are only available in the app installed from Google Play.",
  privacy: "Privacy", privacyText: "PAUSA stores your progress only on this phone. No sign-up needed. Google AdMob ads may use device identifiers according to your consent.",
  resetProgress: "Reset progress", resetConfirm: "Tap again to confirm", rules: "How to play",
  free: "Free", relax: "Relax", challenge: "Challenge", soundOn: "Sound on", soundOff: "Sound off",
  empty: "Empty", playMelody: "Play", clear: "Clear", target: "Target", discovered: "Discovered",
  attract: "Attract", repel: "Repel", rake: "Rake", stone: "Stone", plant: "Plant", ripple: "Ripples", match: "Match!",
  newBest: "New best!", unlocked: "Unlocked!", levelUp: "Level up!", allGames: "50 minigames",
  failed: "Miss!", tryAgain: "Try again", similarity: "Similarity",
};

export const dict = { es, en };
export type TKey = keyof typeof es;
export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = (dict[lang] ?? es)[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}
