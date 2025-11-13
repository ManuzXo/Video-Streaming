const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get("id");

const dropzone = document.getElementById('dropzone');
const videoPlayer = document.getElementById('videoPlayer');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const videoLinkContainer = document.getElementById('videoLinkContainer');
const videoLink = document.getElementById('videoLink');
const copyBtn = document.getElementById('copyBtn');

// Se c'è un id nella query, mostra il video direttamente
if (videoId) {
    dropzone.style.display = 'none';
    fileInput.style.display = 'none';
    videoPlayer.classList.remove('hidden');
    videoPlayer.src = `/video/${videoId}`;
    videoPlayer.load();
    videoPlayer.play();

    videoLinkContainer.classList.remove('hidden');
    videoLink.value = `${window.location.origin}/?id=${videoId}`;
} else {
    dropzone.style.display = 'block';
    videoPlayer.classList.add('hidden');
    videoLinkContainer.classList.add('hidden');

    // Click sulla dropzone apre file picker
    dropzone.addEventListener('click', () => fileInput.click());

    // Upload file dal file picker
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        uploadFile(file);
    });

    // Drag & drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('hover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('hover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('hover');
        const file = e.dataTransfer.files[0];
        if (!file) return;
        uploadFile(file);
    });
}

// Copia link
copyBtn.addEventListener('click', () => {
    videoLink.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copiato!';
    setTimeout(() => copyBtn.textContent = 'Copia', 2000);
});

// Upload e progress bar
function uploadFile(file) {
    dropzone.style.display = 'none';
    uploadProgress.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();

    // Avanzamento upload ZIP (100% = completato)
    xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percent + '%';
            progressBar.textContent = percent + '%';
        }
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);

            uploadProgress.classList.add('hidden');
            videoPlayer.classList.remove('hidden');
            videoPlayer.src = `/video/${data.id}`;
            videoPlayer.load();
            videoPlayer.play();

            videoLinkContainer.classList.remove('hidden');
            videoLink.value = `${window.location.origin}/?id=${data.id}`;
        } else {
            console.error('Errore upload', xhr.responseText);
            progressBar.textContent = 'Errore';
            progressBar.style.background = 'red';
        }
    };

    xhr.onerror = function () {
        console.error('Errore di rete durante l\'upload');
        progressBar.textContent = 'Errore';
        progressBar.style.background = 'red';
    };

    xhr.open('POST', '/upload', true);
    xhr.send(formData);
}
