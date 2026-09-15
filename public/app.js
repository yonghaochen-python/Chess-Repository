// Mode picker: shows the menu, and on a choice, reveals the shared game
// screen and starts the right glue module. Switching modes reloads the
// page, which keeps each mode's setup simple and independent.
const menu = document.getElementById('menu');
const onlineJoin = document.getElementById('online-join');
const game = document.getElementById('game');

document.querySelectorAll('#menu button').forEach((button) => {
  button.addEventListener('click', () => startMode(button.dataset.mode));
});

// If we were mid-game in an online room, jump straight back into it on
// load instead of showing the menu - that's what "a refresh rejoins the
// same game" means from the player's side.
if (localStorage.getItem('chezz-room-code')) {
  startMode('online');
}

async function startMode(mode) {
  if (mode === 'online') {
    menu.hidden = true;
    onlineJoin.hidden = false;
    const { startOnline } = await import('./online.js');
    startOnline();
    return;
  }

  menu.hidden = true;
  game.hidden = false;

  if (mode === 'hotseat') {
    const { startHotseat } = await import('./hotseat.js');
    startHotseat();
  } else if (mode === 'vscomputer') {
    const { startVsComputer } = await import('./vscomputer.js');
    startVsComputer();
  }
}
