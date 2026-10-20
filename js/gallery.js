(() => {
  const status = document.getElementById("galleryStatus");
  const grid = document.getElementById("galleryGrid");
  const viewer = document.getElementById("photoViewer");
  const viewerImage = document.getElementById("photoViewerImage");
  const viewerCaption = document.getElementById("photoViewerCaption");
  const viewerClose = document.getElementById("photoViewerClose");
  const photos = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "8.jpg", "9.jpg", "10.jpg"];

  function showPhoto(photo) {
    viewerImage.src = photo.src;
    viewerImage.alt = photo.alt;
    viewerCaption.textContent = photo.alt;
    viewer.showModal();
  }

  photos.forEach((filename, index) => {
    const photo = {
      src: `images/gallery/${filename}`,
      alt: `Dice Tower community photo ${index + 1}`
    };
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-photo";
    button.setAttribute("aria-label", `View ${photo.alt}`);

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = index < 6 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => button.remove(), { once: true });

    button.append(img);
    button.addEventListener("click", () => showPhoto(photo));
    grid.append(button);
  });

  status.textContent = "";
  viewerClose.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => {
    viewerImage.removeAttribute("src");
    viewerCaption.textContent = "";
  });

  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.getElementById("site-nav");
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("open", !expanded);
  });
})();
