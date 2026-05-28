(function () {
  function initPlayer() {
    var video = document.getElementById('movie-player');
    if (!video) return;
    var source = video.getAttribute('data-video');
    var cover = document.querySelector('.player-cover');
    var hls = null;

    function hideCover() {
      if (cover) cover.classList.add('is-hidden');
    }

    function showMessage(text) {
      if (cover) {
        cover.classList.remove('is-hidden');
        cover.innerHTML = '<span class="player-play">!</span><span>' + text + '</span>';
      }
    }

    function attach() {
      if (!source) {
        showMessage('播放加载遇到问题，请稍后再试');
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (_event, data) {
          if (data && data.fatal) {
            showMessage('播放加载遇到问题，请稍后再试');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        video.src = source;
      }
    }

    attach();

    if (cover) {
      cover.addEventListener('click', function () {
        hideCover();
        var play = video.play();
        if (play && typeof play.catch === 'function') {
          play.catch(function () {
            if (cover) cover.classList.remove('is-hidden');
          });
        }
      });
    }

    video.addEventListener('play', hideCover);
    video.addEventListener('click', function () {
      if (video.paused) {
        var play = video.play();
        if (play && typeof play.catch === 'function') play.catch(function () {});
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hls) hls.destroy();
    });
  }

  document.addEventListener('DOMContentLoaded', initPlayer);
})();
