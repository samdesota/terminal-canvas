import { render } from 'solid-js/web'
import './assets/index.css'
import App from './App'
import 'virtual:uno.css'

render(() => <App />, document.getElementById('root') as HTMLElement)
