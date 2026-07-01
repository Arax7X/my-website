/* ============================================================
   AURELIA — Shared behaviour
   Theme toggle · sticky nav · mobile menu · scroll reveal
   · pricing monthly/annual toggle · year stamp
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  /* ---- Theme (persisted) ---- */
  var THEME_KEY = "aurelia-theme";
  function applyTheme(mode) {
    if (mode === "light") root.classList.add("light");
    else root.classList.remove("light");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "light" ? "#f7f3ec" : "#0b0b0e");
  }
  // initial (also set inline in <head> to avoid flash, this reconciles)
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (!saved) {
    saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  applyTheme(saved);

  function toggleTheme() {
    var next = root.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  }
  ready(function () {
    var btns = document.querySelectorAll("[data-theme-toggle]");
    btns.forEach(function (b) { b.addEventListener("click", toggleTheme); });

    /* ---- Sticky nav shadow ---- */
    var nav = document.querySelector(".nav");
    if (nav) {
      var onScroll = function () {
        if (window.scrollY > 12) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---- Mobile menu ---- */
    var burger = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector(".mobile-menu");
    if (burger && menu) {
      burger.addEventListener("click", function () {
        var open = menu.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* ---- Scroll reveal ---- */
    var reveals = document.querySelectorAll("[data-reveal]");
    if (reveals.length) {
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        reveals.forEach(function (el) { io.observe(el); });
      } else {
        reveals.forEach(function (el) { el.classList.add("in"); });
      }
    }

    /* ---- Pricing monthly / annual toggle ---- */
    var pswitch = document.querySelector("[data-price-switch]");
    if (pswitch) {
      var labMonthly = document.querySelector("[data-price-monthly]");
      var labAnnual = document.querySelector("[data-price-annual]");
      var setMode = function (annual) {
        pswitch.classList.toggle("annual", annual);
        pswitch.setAttribute("aria-checked", annual ? "true" : "false");
        if (labMonthly) labMonthly.classList.toggle("on", !annual);
        if (labAnnual) labAnnual.classList.toggle("on", annual);
        document.querySelectorAll("[data-m]").forEach(function (el) {
          el.textContent = annual ? el.getAttribute("data-a") : el.getAttribute("data-m");
        });
        document.querySelectorAll("[data-per]").forEach(function (el) {
          el.textContent = annual ? "/mo · billed yearly" : "/month";
        });
      };
      pswitch.addEventListener("click", function () {
        setMode(!pswitch.classList.contains("annual"));
      });
      setMode(false);
    }

    /* ---- Year stamp ---- */
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
})();
