(function () {
    window.initMoviePlayer = function (sourceUrl) {
        var video = document.getElementById("movie-player");
        var overlay = document.getElementById("player-overlay");
        var toggle = document.getElementById("player-toggle");
        var mute = document.getElementById("player-mute");
        var fullscreen = document.getElementById("player-fullscreen");
        var message = document.getElementById("player-message");
        var hls = null;

        if (!video || !sourceUrl) {
            return;
        }

        function setMessage(text) {
            if (message) {
                message.textContent = text || "";
            }
        }

        function load() {
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(sourceUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        setMessage("视频加载失败，请稍后再试");
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
            } else {
                setMessage("视频加载失败，请稍后再试");
            }
        }

        function updateState() {
            if (toggle) {
                toggle.textContent = video.paused ? "▶" : "暂停";
            }
            if (overlay) {
                overlay.classList.toggle("is-hidden", !video.paused);
            }
        }

        function play() {
            var result = video.play();
            if (result && typeof result.catch === "function") {
                result.catch(function () {
                    setMessage("请再次点击播放");
                });
            }
        }

        function togglePlay() {
            if (video.paused) {
                play();
            } else {
                video.pause();
            }
        }

        load();

        if (overlay) {
            overlay.addEventListener("click", function () {
                overlay.classList.add("is-hidden");
                play();
            });
        }

        if (toggle) {
            toggle.addEventListener("click", togglePlay);
        }

        video.addEventListener("click", togglePlay);
        video.addEventListener("play", updateState);
        video.addEventListener("pause", updateState);
        video.addEventListener("ended", updateState);
        video.addEventListener("loadedmetadata", function () {
            setMessage("");
        });

        if (mute) {
            mute.addEventListener("click", function () {
                video.muted = !video.muted;
                mute.textContent = video.muted ? "静音" : "声音";
            });
        }

        if (fullscreen) {
            fullscreen.addEventListener("click", function () {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (video.requestFullscreen) {
                    video.requestFullscreen();
                }
            });
        }

        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });

        updateState();
    };
})();
