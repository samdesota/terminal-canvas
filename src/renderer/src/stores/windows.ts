import { createStore, produce } from 'solid-js/store'
import { v4 as generateUUID } from 'uuid'

export interface WindowDef {
  id: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

const [windows, setWindows] = createStore<Record<string, WindowDef>>({})

export { windows }

export function getWindowsList() {
  return Object.values(windows)
}

export function createWindow(position: { x: number; y: number }) {
  const uuid = generateUUID()
  setWindows(uuid, { id: uuid, position: { ...position, width: 575, height: 336 } })
}

export function removeWindow(id: string) {
  setWindows(
    produce((windows) => {
      delete windows[id]
    })
  )
}

export function updateWindowBounds(
  id: string,
  newPosition: Partial<{ x: number; y: number; height: number; width: number }>
) {
  setWindows(id, 'position', (position) => ({ ...position, ...newPosition }))
}
