
import { H as Hls } from './hls-vendor.js';

document.querySelectorAll('[data-player]').forEach((wrap) => {
  const video = wrap.querySelector('video');
  const src = wrap.getAttribute('data-src');
  const status = wrap.querySelector('[data-status]');
  const btnPlay = wrap.querySelector('[data-action="play"]');
  const btnMute = wrap.querySelector('[data-action="mute"]');
  const btnFs = wrap.querySelector('[data-action="fs"]');
  const btnRestart = wrap.querySelector('[data-action="restart"]');
  const btnSpeed = wrap.querySelector('[data-action="speed"]');
  const speedValues = [1, 1.25, 1.5, 2];
  let speedIdx = 0;
  let hls = null;

  function setStatus(text){ if (status) status.textContent = text || ''; }
  function syncButtons(){
    if (!video) return;
    if (btnPlay) btnPlay.textContent = video.paused ? '播放' : '暂停';
    if (btnMute) btnMute.textContent = video.muted ? '取消静音' : '静音';
    if (btnSpeed) btnSpeed.textContent = `倍速 ${speedValues[speedIdx]}x`;
  }
  function playPause(){
    if (!video) return;
    if (video.paused) video.play().catch(()=>{}); else video.pause();
  }
  function toggleMute(){ if (!video) return; video.muted = !video.muted; syncButtons(); }
  function restart(){ if (!video) return; video.currentTime = 0; video.play().catch(()=>{}); }
  function toggleFullscreen(){
    if (!video) return;
    const player = wrap.querySelector('.player-shell') || wrap;
    if (document.fullscreenElement) document.exitFullscreen(); else player.requestFullscreen?.();
  }

  if (video && src) {
    if (Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setStatus('播放就绪'); syncButtons(); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data && data.fatal) setStatus('视频加载失败，请稍后重试');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => setStatus('播放就绪'));
    } else {
      setStatus('您的浏览器暂不支持 HLS 播放');
    }
  }

  video && video.addEventListener('click', playPause);
  video && video.addEventListener('play', syncButtons);
  video && video.addEventListener('pause', syncButtons);

  btnPlay && btnPlay.addEventListener('click', playPause);
  btnMute && btnMute.addEventListener('click', toggleMute);
  btnFs && btnFs.addEventListener('click', toggleFullscreen);
  btnRestart && btnRestart.addEventListener('click', restart);
  btnSpeed && btnSpeed.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % speedValues.length;
    if (video) video.playbackRate = speedValues[speedIdx];
    syncButtons();
  });

  syncButtons();
});
