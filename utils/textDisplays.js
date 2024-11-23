export function updateTitleText(levelNumber) {
    const title = document.getElementById('game-title');
    title.style.display = 'block';
    title.innerText = `Level: ${levelNumber}`;
}

