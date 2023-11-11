import { Component, For, createSignal } from 'solid-js'
import { createWindow, getWindowsList, updateWindowBounds, windows } from './stores/windows'
import 'xterm/css/xterm.css'
import { Window } from './components/Window'

const App: Component = () => {
  const [transform, setTransform] = createSignal({ x: 0, y: 0 })

  return (
    <div
      class="h-screen overflow-hidden w-screen"
      style={{ 'background-color': 'rgba(0, 0, 0, 0.7)' }}
      onClick={(e) => {
        createWindow({ x: e.clientX - transform().x, y: e.clientY - transform().y })
      }}
      onWheel={(e) => {
        if (e.shiftKey) {
          const windowElements = Array.from(
            document.querySelectorAll('[data-window-id]')
          ) as HTMLElement[]

          for (const win of windowElements) {
            const rect = win.getBoundingClientRect()

            if (
              e.clientX >= rect.x &&
              e.clientY >= rect.y &&
              e.clientX <= rect.right &&
              e.clientY <= rect.bottom
            ) {
              const windowId = win.dataset.windowId as string

              if (windowId) {
                updateWindowBounds(windowId, {
                  x: windows[windowId].position.x + e.deltaX,
                  y: windows[windowId].position.y + e.deltaY
                })

                setTransform({
                  x: transform().x + -e.deltaX,
                  y: transform().y + -e.deltaY
                })
              }

              return
            }
          }
        }

        setTransform({
          x: transform().x + -e.deltaX,
          y: transform().y + -e.deltaY
        })
      }}
    >
      <div style={{ position: 'absolute', top: transform().y + 'px', left: transform().x + 'px' }}>
        <For each={getWindowsList()}>
          {(value) => {
            return <Window win={value} />
          }}
        </For>
      </div>
    </div>
  )
}

export default App
