// Типы данных игры. Здесь только описание того, как выглядят данные, — без логики.

/** Настройки, которые задаются до начала игры. */
export type Settings = {
  /** Стоимость входа в игру. */
  buyIn: number
  /** Стоимость одного ребая (докупки). */
  rebuyCost: number
  /** Сколько фишек получает игрок на старте и за каждый ребай. */
  startingStack: number
  /** Стартовый малый блайнд. */
  smallBlind: number
  /** Стартовый большой блайнд. */
  bigBlind: number
}

/** Игрок за столом. */
export type Player = {
  id: string
  name: string
  /** Сколько раз игрок сделал ребай. */
  rebuys: number
  /** Когда игрок выбыл (время в миллисекундах). null — ещё в игре. */
  bustedAt: number | null
}

/** Текущая игра целиком. */
export type Game = {
  settings: Settings
  players: Player[]
  /** Когда игра началась (время в миллисекундах). */
  startedAt: number
}

/** Строка итоговой таблицы: игрок и его место (null — место ещё не определено). */
export type Standing = {
  player: Player
  place: number | null
}
