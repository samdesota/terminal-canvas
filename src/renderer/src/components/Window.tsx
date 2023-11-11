import { createEffect, createSignal, onCleanup } from 'solid-js'
import { removeWindow, updateWindowBounds, WindowDef } from '../stores/windows'
import { Terminal } from 'xterm'
import { AttachAddon } from 'xterm-addon-attach'

export function Window(props: { win: WindowDef }) {
  const [term, setTerm] = createSignal<null | Terminal>()
  const rowHeight = 14
  const columnWidth = 7.2

  let terminalContainer: HTMLDivElement

  createEffect(() => {
    const term = new Terminal({
      fontSize: 12,
      rows: 24,
      cols: 80
    })

    term.open(terminalContainer)

    const ws = new WebSocket(`ws://localhost:3333/${props.win.id}`)
    const attach = new AttachAddon(ws)

    ws.onclose = () => removeWindow(props.win.id)

    term.loadAddon(attach)

    setTerm(term)

    return () => {
      term.dispose()
    }
  })

  const [dragStart, setDragStart] = createSignal<null | {
    dragType: 'resize' | 'move'
    cursor: { x: number; y: number }
    window: { x: number; y: number; height: number; width: number }
  }>(null)

  createEffect(() => {
    if (dragStart()) {
      const onMove = (e: MouseEvent) => {
        if (e.buttons !== 1) {
          setDragStart(null)
          return
        }

        const start = dragStart()

        if (start) {
          const deltaX = e.clientX - start.cursor.x
          const deltaY = e.clientY - start.cursor.y

          if (start.dragType === 'resize') {
            const newSize = {
              height: start.window.height + deltaY,
              width: start.window.width + deltaX
            }

            updateWindowBounds(props.win.id, newSize)

            const newRows = Math.floor(newSize.height / rowHeight)
            const newColumns = Math.floor(newSize.width / columnWidth)

            if (term()?.cols !== newColumns || term()?.rows !== newRows) {
              term()?.resize(newColumns, newRows)
              window.api.invoke('resizeTerminal', props.win.id, { cols: newColumns, rows: newRows })
            }
          } else if (start.dragType === 'move') {
            console.log('ran')
            const newPositon = { x: start.window.x + deltaX, y: start.window.y + deltaY }
            updateWindowBounds(props.win.id, newPositon)
          }
        }
      }

      const onMouseUp = () => {
        setDragStart(null)
      }

      document.body.addEventListener('mousemove', onMove)
      onCleanup(() => document.body.removeEventListener('mousemove', onMove))

      document.body.addEventListener('mouseup', onMouseUp)
      onCleanup(() => document.body.removeEventListener('mouseup', onMouseUp))
    }
  })

  return (
    <div
      class="border-2 border-solid border-white bg-black"
      data-window-id={props.win.id}
      style={{
        position: 'absolute',
        top: props.win.position.y + 'px',
        left: props.win.position.x + 'px',
        'box-sizing': 'content-box'
      }}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div
        onMouseDown={(e) => {
          console.log('ran?')
          setDragStart({
            dragType: 'move',
            cursor: { x: e.clientX, y: e.clientY },
            window: { ...props.win.position }
          })
        }}
        class="h-4 bg-white"
      ></div>
      <div
        style={{
          width: props.win.position.width + 'px',
          height: props.win.position.height + 'px'
        }}
      >
        {/* @ts-ignore */}
        <div ref={terminalContainer}></div>
      </div>

      <div
        class="h-4 w-4 bg-red absolute bottom-0 right-0"
        onMouseDown={(e) => {
          setDragStart({
            dragType: 'resize',
            cursor: { x: e.clientX, y: e.clientY },
            window: { ...props.win.position }
          })
        }}
      ></div>
    </div>
  )
}
