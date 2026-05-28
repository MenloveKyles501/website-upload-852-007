document.addEventListener("DOMContentLoaded", function () {
    initializeNavigation();
    initializeHero();
    initializeFilters();
    initializePlayers();
});

function initializeNavigation() {
    var button = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");

    if (!button || !nav) {
        return;
    }

    button.addEventListener("click", function () {
        nav.classList.toggle("is-open");
    });
}

function initializeHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
        return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var index = 0;

    function show(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === index);
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === index);
        });
    }

    dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
            show(Number(dot.getAttribute("data-hero-dot")) || 0);
        });
    });

    if (slides.length > 1) {
        window.setInterval(function () {
            show(index + 1);
        }, 5600);
    }
}

function initializeFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));

    scopes.forEach(function (scope) {
        var container = scope.parentElement;
        var target = container ? container.querySelector(".filter-target") : null;
        var search = scope.querySelector(".movie-search");
        var selects = Array.prototype.slice.call(scope.querySelectorAll(".filter-select"));

        if (!target) {
            target = document.querySelector(".filter-target");
        }

        if (!target) {
            return;
        }

        var cards = Array.prototype.slice.call(target.querySelectorAll(".movie-card"));

        function apply() {
            var keyword = search ? search.value.trim().toLowerCase() : "";

            cards.forEach(function (card) {
                var matched = true;
                var text = card.getAttribute("data-search") || "";

                if (keyword && text.indexOf(keyword) === -1) {
                    matched = false;
                }

                selects.forEach(function (select) {
                    var key = select.getAttribute("data-filter");
                    var value = select.value;

                    if (value && (card.getAttribute("data-" + key) || "") !== value) {
                        matched = false;
                    }
                });

                card.hidden = !matched;
            });
        }

        if (search) {
            search.addEventListener("input", apply);
        }

        selects.forEach(function (select) {
            select.addEventListener("change", apply);
        });
    });
}

function initializePlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    players.forEach(function (shell) {
        var video = shell.querySelector("video");
        var cover = shell.querySelector(".player-cover");

        if (!video || !cover) {
            return;
        }

        function attach() {
            var stream = video.getAttribute("data-stream");

            if (!stream) {
                return;
            }

            if (video.getAttribute("data-ready") !== "1") {
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });

                    hls.loadSource(stream);
                    hls.attachMedia(video);
                    window.__movieHls = window.__movieHls || [];
                    window.__movieHls.push(hls);
                } else {
                    video.src = stream;
                }

                video.setAttribute("data-ready", "1");
            }

            shell.classList.add("is-playing");
            video.controls = true;

            var playRequest = video.play();

            if (playRequest && typeof playRequest.catch === "function") {
                playRequest.catch(function () {});
            }
        }

        cover.addEventListener("click", attach);

        video.addEventListener("click", function () {
            if (video.paused) {
                attach();
            } else {
                video.pause();
            }
        });
    });
}
