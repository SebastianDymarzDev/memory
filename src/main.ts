import './styles/style.scss'

const startView = document.querySelector<HTMLElement>('#start-view')!
const settingsView = document.querySelector<HTMLElement>('#settings-view')!
const playBtn = document.querySelector<HTMLButtonElement>('#play-btn')!

playBtn.addEventListener('click', () => {
  startView.hidden = true
  settingsView.hidden = false
})