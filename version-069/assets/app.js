(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var toggle = document.querySelector(".mobile-toggle");
        var mobileNav = document.querySelector(".mobile-nav");

        if (toggle && mobileNav) {
            toggle.addEventListener("click", function () {
                var opened = mobileNav.classList.toggle("is-open");
                toggle.setAttribute("aria-expanded", opened ? "true" : "false");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }

        var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
        scopes.forEach(function (scope) {
            var input = scope.querySelector(".js-search-input");
            var grid = document.querySelector(".js-card-grid");
            var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".searchable-card")) : [];
            var activeType = "all";
            var activeRegion = "all";

            function applyFilter() {
                var query = input ? input.value.trim().toLowerCase() : "";
                cards.forEach(function (card) {
                    var text = (card.getAttribute("data-search") || "").toLowerCase();
                    var type = card.getAttribute("data-type") || "";
                    var region = card.getAttribute("data-region") || "";
                    var ok = (!query || text.indexOf(query) !== -1) &&
                        (activeType === "all" || type === activeType) &&
                        (activeRegion === "all" || region === activeRegion);
                    card.classList.toggle("is-hidden", !ok);
                });
            }

            if (input) {
                var params = new URLSearchParams(window.location.search);
                var initial = params.get("q");
                if (initial) {
                    input.value = initial;
                }
                input.addEventListener("input", applyFilter);
            }

            scope.querySelectorAll("[data-filter-type]").forEach(function (button) {
                button.addEventListener("click", function () {
                    activeType = button.getAttribute("data-filter-type") || "all";
                    scope.querySelectorAll("[data-filter-type]").forEach(function (item) {
                        item.classList.toggle("active", item === button);
                    });
                    applyFilter();
                });
            });

            scope.querySelectorAll("[data-filter-region]").forEach(function (button) {
                button.addEventListener("click", function () {
                    activeRegion = button.getAttribute("data-filter-region") || "all";
                    scope.querySelectorAll("[data-filter-region]").forEach(function (item) {
                        item.classList.toggle("active", item === button);
                    });
                    applyFilter();
                });
            });

            applyFilter();
        });
    });
})();
