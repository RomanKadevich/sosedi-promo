const root = document.documentElement;
const stage = document.querySelector(".stage");

function fitCanvas() {
  const mobile = window.innerWidth <= 767;
  const width = mobile ? 375 : 1440;
  const height = mobile ? 5273 : 4184;
  const scale = window.innerWidth / width;
  root.style.setProperty("--scale", String(scale));
  stage.style.height = `${height * scale}px`;
}

fitCanvas();
window.addEventListener("resize", fitCanvas, { passive: true });

function updateFaqScrollbar(box) {
  const list = box?.querySelector(".faq-list");
  const track = box?.querySelector(".faq-scrollbar");
  const thumb = track?.querySelector("span");
  if (!list || !track || !thumb) return;

  const scrollRange = Math.max(0, list.scrollHeight - list.clientHeight);
  const thumbRange = Math.max(0, track.clientHeight - thumb.offsetHeight);
  const position = scrollRange
    ? (list.scrollTop / scrollRange) * thumbRange
    : 0;
  track.style.setProperty("--faq-scroll-top", `${position}px`);
}

document.querySelectorAll(".faq-box").forEach((box) => {
  const list = box.querySelector(".faq-list");
  list?.addEventListener("scroll", () => updateFaqScrollbar(box), {
    passive: true,
  });
  updateFaqScrollbar(box);
});

document.querySelectorAll("details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) {
      item.parentElement.querySelectorAll("details").forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
    requestAnimationFrame(() => updateFaqScrollbar(item.closest(".faq-box")));
  });
});

const slider = document.querySelector("[data-slider]");
if (slider) {
  const track = slider.querySelector(".mobile-track");
  const dots = [...document.querySelectorAll(".m-steps .dots button")];
  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => {
      track.style.transform = `translateX(-${index * 350}px)`;
      dots.forEach((item, dotIndex) =>
        item.classList.toggle("active", dotIndex === index),
      );
    }),
  );
}

const menus = [...document.querySelectorAll(".menu-preview")];
function setMenu(open) {
  menus.forEach((menu) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
  });
  document.body.classList.toggle("menu-open", open);
}

document.querySelectorAll("[data-menu-open]").forEach((button) => {
  button.addEventListener("click", () => setMenu(true));
});
document
  .querySelectorAll("[data-menu-close], .menu-preview a")
  .forEach((control) => {
    control.addEventListener("click", () => setMenu(false));
  });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

document.querySelectorAll("[data-product-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".product-row, .m-product-track");
  const cards = [...(track?.children || [])];
  const mobileCarousel = carousel.classList.contains("m-product-carousel");
  const visibleCards = mobileCarousel ? 1 : 4;
  const lastIndex = Math.max(0, cards.length - visibleCards);
  const dots = mobileCarousel
    ? [...carousel.parentElement.querySelectorAll("[data-product-dots] button")]
    : [];
  const previousButton = carousel.querySelector(".product-arrow--prev");
  const nextButton = carousel.querySelector(".product-arrow--next");
  let index = 0;

  function renderProductSlide(nextIndex) {
    if (!track || !cards.length) return;
    index = Math.max(0, Math.min(lastIndex, nextIndex));
    track.style.transform = `translateX(-${cards[index].offsetLeft}px)`;
    dots.forEach((dot, dotIndex) =>
      dot.classList.toggle("active", dotIndex === index),
    );
    if (previousButton) previousButton.disabled = index === 0;
    if (nextButton) nextButton.disabled = index === lastIndex;
  }

  previousButton?.addEventListener("click", () => renderProductSlide(index - 1));
  nextButton?.addEventListener("click", () => renderProductSlide(index + 1));
  dots.forEach((dot, dotIndex) =>
    dot.addEventListener("click", () => renderProductSlide(dotIndex)),
  );

  renderProductSlide(0);
});

document.querySelectorAll("[data-prize-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".prize-track, .m-prize-track");
  const slides = [...(track?.children || [])];
  const previousButton = carousel.querySelector(".prize-arrow--prev");
  const nextButton = carousel.querySelector(".prize-arrow--next");
  const dots = [...carousel.querySelectorAll(".prize-dots button")];
  let index = 0;
  let physicalIndex = 1;
  let wrapTarget = null;
  let pointerStart = null;
  let isAnimating = false;

  if (track && slides.length > 1) {
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("aria-hidden", "true");
    track.prepend(lastClone);
    track.append(firstClone);
  }

  function moveTrack(animate) {
    const physicalSlides = [...(track?.children || [])];
    if (!track || !physicalSlides[physicalIndex]) return;
    track.style.transitionDuration = animate ? "420ms" : "0ms";
    track.style.transform = `translateX(-${physicalSlides[physicalIndex].offsetLeft}px)`;
  }

  function updatePrizeUi() {
    carousel.classList.toggle("is-alternate", index !== 0);
    dots.forEach((dot, dotIndex) =>
      dot.classList.toggle("active", dotIndex === index),
    );
  }

  function renderPrizeSlide(nextIndex, animate = true) {
    if (!track || !slides.length) return;
    if (animate && isAnimating) return;
    wrapTarget = null;

    if (!animate || slides.length === 1) {
      index = (nextIndex + slides.length) % slides.length;
      physicalIndex = index + 1;
    } else if (nextIndex >= slides.length) {
      index = 0;
      physicalIndex = slides.length + 1;
      wrapTarget = 1;
    } else if (nextIndex < 0) {
      index = slides.length - 1;
      physicalIndex = 0;
      wrapTarget = slides.length;
    } else {
      index = nextIndex;
      physicalIndex = index + 1;
    }

    isAnimating = animate;
    moveTrack(animate);
    // On an edge wrap the track is still showing the cloned edge slide.
    // Keep all external carousel state on the current card until that motion
    // completes, otherwise labels/background layers switch a frame too early.
    if (wrapTarget === null) updatePrizeUi();
  }

  track?.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    isAnimating = false;
    if (wrapTarget !== null) {
      physicalIndex = wrapTarget;
      wrapTarget = null;
      moveTrack(false);
      updatePrizeUi();
    }
  });

  previousButton?.addEventListener("click", () => renderPrizeSlide(index - 1));
  nextButton?.addEventListener("click", () => renderPrizeSlide(index + 1));
  dots.forEach((dot, dotIndex) =>
    dot.addEventListener("click", () => renderPrizeSlide(dotIndex)),
  );

  carousel.addEventListener("pointerdown", (event) => {
    pointerStart = event.clientX;
  });
  carousel.addEventListener("pointerup", (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) > 42) {
      renderPrizeSlide(index + (distance < 0 ? 1 : -1));
    }
  });
  carousel.addEventListener("pointercancel", () => {
    pointerStart = null;
  });
  window.addEventListener("resize", () => renderPrizeSlide(index, false), {
    passive: true,
  });

  renderPrizeSlide(0, false);
});
