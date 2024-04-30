document.getElementById('level1').addEventListener('click', function(event) {
    event.preventDefault();
    showLoading();
    playSound('MENU A_Select.wav', () => {
        window.location.href = 'level1.html';
    });
});

document.getElementById('level2').addEventListener('click', function(event) {
    event.preventDefault();
    showLoading();
    playSound('MENU A_Select.wav', () => {
        window.location.href = 'level2.html';
    });
});

function playSound(filename, callback) {
    var audio = new Audio(filename);
    audio.play().then(() => {
        audio.addEventListener('ended', () => {
            hideLoading();
            callback();
        });
    }).catch(error => {
        console.error("Error playing the sound: ", error);
        hideLoading();
        callback();
    });
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}
