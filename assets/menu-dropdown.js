let items = document
    .querySelector(".header__inline-menu")
    .querySelectorAll("details");
for (const item of items) {
    item.addEventListener("mouseover", () => {
        item.setAttribute("open", true);
        item.querySelector("ul").addEventListener("mouseleave", () => {
            item.removeAttribute("open");
        });
        item.addEventListener("mouseleave", () => {
            item.removeAttribute("open");
        });
    });
}