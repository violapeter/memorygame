/** @constant */
const SYMBOLS = [
  "😺",
  "🖐",
  "🧳",
  "☂️",
  "🧵",
  "🧶",
  "👓",
  "👕",
  "👑",
  "👠",
  "🐞",
  "🦋",
  "🐝",
  "🐟",
  "🍄",
  "🐚",
  "🌻",
  "⛄️",
  "🍎",
  "🚗",
  "🏀",
  "🦄",
  "🦊",
  "🌎",
  "🍉",
  "🍩",
  "🍿",
  "🥝",
  "🎸",
  "🚜",
  "⏰",
  "🔑",
  "🎁",
]

/** @constant */
const SHOW_CARD_DURATION = 1500

/** @constant */
const LOCAL_STORAGE_NAMESPACE = 'hu.violapeter.memorygame'

/** @enum */
const GameDifficulty = {
  Beginner: 4,
  Intermediate: 6,
  Advanced: 8,
}

/**
 * @enum
 */
const GameStatus = {
  Won: 'WON',
  BeginGame: 'BEGIN_GAME',
  InGame: 'IN_GAME',
  BetweenSteps: 'BETWEEN_STEPS',
}

/**
 * @typedef {{
 *   turned: number[],
 *   found: number[],
 *   board?: string[],
 *   steps: number,
 *   status: GameStatus,
 *   timerId?: number,
 *   startTime?: number,
 *   difficulty: GameDifficulty,
 * }} AppState
 */

/**
 * Current state of the game
 *
 * @type AppState
 */
const AppState = {
  board: null,
  turned: [],
  found: [],
  steps: 0,
  status: GameStatus.BeginGame,
  timerId: undefined,
  startTime: 0,
  difficulty: GameDifficulty.Intermediate,
}

/**
 * @param {*[]} array
 * @returns {[]}
 */
function shuffle(array) {
  const collection = array
  let len = array.length
  let random
  let temp

  while (len) {
    random = Math.floor(Math.random() * len)
    len -= 1
    temp = collection[len]
    collection[len] = collection[random]
    collection[random] = temp
  }

  return collection
}

/**
 * @param {*[]} data
 * @param {number} count
 * @returns {*[]}
 */
function pickRandom(data, count) {
  data = [...data]

  const pickedElements = []

  while (count--) {
    pickedElements.push(data.splice(Math.floor(Math.random() * data.length), 1)[0])
  }

  return pickedElements
}

/** @returns {boolean} */
function isPairRevealedInStep() {
  return AppState.turned.length % 2 === 0
}

/** @returns {boolean} */
function isWin() {
  return AppState.turned.length === AppState.board.length
}

/** Resets the last turned 2 cards */
function turnBackCards() {
  setTimeout(() => {
    AppState.turned = AppState.turned.slice(0, -2)
    AppState.status = GameStatus.InGame
    updateUI(AppState)
  }, SHOW_CARD_DURATION)
}

function clearGame() {
  if (AppState.timerId !== undefined) {
    clearInterval(AppState.timerId)
    AppState.timerId = undefined
  }
  clearLocalStorage()
}

/** Checks the app's state and decides the next step */
function checkState() {
  if (!isPairRevealedInStep()) {
    return
  }

  AppState.status = GameStatus.BetweenSteps

  if (isWin()) {
    AppState.status = GameStatus.Won
    clearGame()
    return
  }

  if (isPair()) {
    AppState.status = GameStatus.InGame
    pairFound()
    return
  }

  turnBackCards()
}

/**
 * @param index
 * @return {HTMLDivElement}
 */
function getCardElementByIndex(index) {
  return document.querySelector(`.card[data-id="${index}"]`)
}

/** @return {number[]} */
function getLastTurnedPair() {
  return AppState.turned.slice(-2)
}

/** @returns {boolean} */
function isPair() {
  const [a, b] = getLastTurnedPair()
  return AppState.board[a] === AppState.board[b]
}

function pairFound() {
  AppState.found.push(...getLastTurnedPair())
  getLastTurnedPair().forEach((index) => {
    const el = getCardElementByIndex(index)
    el.classList.add('found')
    setTimeout(() => {
      moveCardOutOfBoardWithTransition(el, 0.1)
    }, 1000)
  })
}

/** @param {number} cardId */
function turnCard(cardId) {
  if (AppState.turned.includes(cardId)) {
    return
  }
  AppState.turned.push(cardId)
  AppState.steps++
  checkState()
}

/** @returns {boolean} */
function isCardTurnAllowed() {
  return AppState.status === GameStatus.InGame || AppState.status === GameStatus.BeginGame
}

/** @returns {boolean} */
function shouldInitTimer() {
  return AppState.status === GameStatus.BeginGame && !AppState.timerId
}

function startTimer() {
  AppState.timerId = setInterval(() => updateUI(AppState), 1000)
}

function initTimer() {
  if (!shouldInitTimer()) {
    return
  }

  AppState.status = GameStatus.InGame
  AppState.startTime = Date.now()
  startTimer()
  updateUI(AppState)
}

/** @param {number} cardId */
function handleClickCard(cardId) {
  if (!isCardTurnAllowed()) {
    return
  }
  turnCard(cardId)
  updateUI(AppState)
  initTimer()
}


/**
 * @param {string[]} board
 * @returns {string}
 */
function renderBoard(board) {
  return board.map((content, id) => `
    <button class="card" data-id="${id}" aria-label="Kártya megrdítása">
      <div class="card-inner">
        <div class="card-back" aria-hidden="true"></div>
        <div class="card-front" aria-hidden="true">${content}</div>
      </div>
    </button>`).join('')
}

/** @return {NodeListOf<Element>} */
function getCards() {
  return document.querySelectorAll('.card')
}

/**
 * Callback of the iterateCards function.
 * @see iterateCards
 * @callback iteratorCallback
 * @param {HTMLDivElement} card
 * @param {number} index
 */

/**
 * @param {iteratorCallback} callback
 */
function iterateCards(callback) {
  getCards().forEach(callback)
}

/**
 * @param {AppState} state
 * @void
 */
function renderUI(state) {
  document.querySelector('.board').innerHTML = renderBoard(state.board)
  iterateCards((card, index) => {
    card.addEventListener('click', () => handleClickCard(index))
    card.classList[state.found.includes(index) ? 'add' : 'remove']('already-found')
  })
  document.querySelectorAll('.js-yes, .js-replay').forEach((el) => {
    el.addEventListener('click', () => {
      startNewGame()
    })
  })

  document.documentElement.style.setProperty('--grid', String(state.difficulty))
  updateUI(state)
}

/**
 * @param {number} milliseconds
 * @returns {string}
 */
function convertMsToMinutesSeconds(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000)
  const seconds = Math.round((milliseconds % 60000) / 1000)

  return seconds === 60
    ? `${minutes + 1}:00`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** @param {AppState} state */
function updateUI(state) {
  iterateCards((card, cardId) => {
    card.classList[state.turned.includes(cardId) ? 'add' : 'remove']('turned')
  })
  document.querySelector('.win').classList[state.status === GameStatus.Won ? 'add' : 'remove']('open')
  document.querySelector('.js-time').innerHTML = convertMsToMinutesSeconds(
    Date.now() - state.startTime
  )
  document.querySelector('.js-steps').innerHTML = `${AppState.steps} lépés`

  if (shouldSave()) {
    saveToLocalStorage(state)
  }
}

/**
 * @param {number} columns
 * @param {number} [rows]
 * @returns {string[]}
 */
function generateBoard(columns, rows = columns) {
  const symbolCount = (columns * rows) / 2
  const symbols = pickRandom(SYMBOLS, symbolCount)
  return shuffle([...symbols, ...symbols])
}

/** @returns {boolean} */
function shouldSave() {
  return AppState.status === GameStatus.InGame || AppState.status === GameStatus.BetweenSteps
}

/** @param {AppState} state */
function saveToLocalStorage(state) {
  const asString = JSON.stringify(state)
  localStorage.setItem(LOCAL_STORAGE_NAMESPACE, asString)
}

/** @returns {(AppState|null)} */
function readStateFromLocalStorage() {
  const stored = localStorage.getItem(LOCAL_STORAGE_NAMESPACE)
  if (stored === null) {
    return null
  }
  return JSON.parse(stored)
}

function clearLocalStorage() {
  if (localStorage.getItem(LOCAL_STORAGE_NAMESPACE) !== null) {
    localStorage.removeItem(LOCAL_STORAGE_NAMESPACE)
  }
}

function startNewGame() {
  clearGame()
  AppState.board = generateBoard(AppState.difficulty)
  AppState.turned = []
  AppState.found = []
  AppState.steps = 0
  AppState.status = GameStatus.BeginGame
  AppState.startTime = Date.now()
  renderUI(AppState)
  dealCards()
}

/** @param {AppState} state */
function restoreSavedGame(state) {
  AppState.board = state.board
  AppState.turned = state.turned
  AppState.found = state.found
  AppState.steps = state.steps
  AppState.status = state.status
  AppState.startTime = state.startTime
  AppState.difficulty = state.difficulty

  startTimer()
  if (AppState.status === GameStatus.BetweenSteps) {
    checkState()
  }
  renderUI(AppState)
}

/** @param {HTMLDivElement} card */
function moveCardOutOfBoard(card) {
  const BOX_SHADOW_CORRECTION = 12
  const { x, y, width, height } = card.getBoundingClientRect()
  card.style.setProperty(
    'transform',
    `translate(-${x + width + BOX_SHADOW_CORRECTION}px, -${y + height + BOX_SHADOW_CORRECTION}px)`
  )
}

/**
 * @param {HTMLDivElement} card
 * @param {number} transitionDelay
 */
function moveCardOutOfBoardWithTransition(card, transitionDelay) {
  const removeTransitionProperty = () => {
    card.style.removeProperty('transition')
    card.style.removeProperty('transition-delay')
    card.removeEventListener('transitionend', removeTransitionProperty)
  }

  card.style.setProperty('transition', 'transform .2s ease')
  card.style.setProperty('transition-delay', `${transitionDelay}s`)
  card.addEventListener('transitionend', removeTransitionProperty)
  moveCardOutOfBoard(card)
}

function moveCardsOutOfBoard() {
  iterateCards(moveCardOutOfBoard)
}

function dealCards() {
  moveCardsOutOfBoard()
  setTimeout(() => {
    iterateCards((card, index) => {
      card.style.setProperty('transition', 'transform .2s ease')
      card.style.setProperty('transition-delay', `${index * 0.02}s`)
      card.style.removeProperty('transform')
    })
  }, 10)
}

/** Entry point */
function init() {
  const savedGame = readStateFromLocalStorage()
  if (savedGame) {
    restoreSavedGame(savedGame)
    return
  }

  startNewGame()
}

init()
