
import { H as Hls } from './hls.js';

function initPlayer(root) {
  const video = root.querySelector('video[data-video-url]');
  const btn = root.querySelector('[data-play-btn]');
  const status = root.querySelector('[data-player-status]');
  if (!video) return;
  const src = video.dataset.videoUrl;
  let loaded = false;

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function ensureSource() {
    if (loaded) return;
    loaded = true;
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (_, data) {
        if (data.fatal) setStatus('播放源加载中…');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      setStatus('当前浏览器不支持 HLS 播放');
    }
  }

  function play() {
    ensureSource();
    const p = video.play();
    if (p && p.catch) p.catch(() => setStatus('请再次点击播放按钮'));
    setStatus('正在播放…');
  }

  if (btn) btn.addEventListener('click', play);
  root.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-play-btn]')) return;
    play();
  });
}

document.querySelectorAll('[data-player]').forEach(initPlayer);
