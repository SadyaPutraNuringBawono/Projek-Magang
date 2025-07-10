import { init, type RematchDispatch, type RematchRootState } from "@rematch/core"
import { models, type RootModel } from "./models"

const store = init({
  models,
})

export default store

export type Store = typeof store
export type Dispatch = RematchDispatch<RootModel>
export type RootState = RematchRootState<RootModel>

