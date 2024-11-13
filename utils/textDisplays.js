export function updateTitleText(levelNumber) {
    const title = document.getElementById('game-title');
    title.innerText = `Level: ${levelNumber}`;
}