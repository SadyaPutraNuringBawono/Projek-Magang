import { init, type RematchDispatch, type RematchRootState } from "@rematch/core"
import { auth } from "./models/auth"

export const models = { auth }

export const store = init({
  models,
})

export type Store = typeof store
export type RootModel = typeof models
export type Dispatch = RematchDispatch<RootModel>
export type RootState = RematchRootState<RootModel>

