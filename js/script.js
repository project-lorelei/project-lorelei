document.addEventListener("DOMContentLoaded", () => {


let notificationTimeout;

function showFavoriteNotification(name) {
    const notification = document.getElementById("favoriteNotification");
    const notificationText = document.getElementById("notificationText");

    if (!notification || !notificationText) return;

    notificationText.textContent = name;
    notification.classList.add("show");

    clearTimeout(notificationTimeout);

    notificationTimeout = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}


 // FAVORITES SYSTEM

const FAVORITES_KEY = "lorelei-favorites";

let favoriteCharacters = JSON.parse(
    localStorage.getItem(FAVORITES_KEY) || "[]"
);

const favoritesGrid = document.getElementById("favoritesGrid");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const charactersGrid = document.getElementById("charactersGrid");

// Создаём сердечки
document.querySelectorAll("#charactersGrid .character-card").forEach(card => {
    if (card.querySelector(".favorite-toggle")) return;

    const heart = document.createElement("button");
    heart.className = "favorite-toggle";
    heart.type = "button";

    heart.innerHTML = `
        <svg viewBox="0 0 24 24" width="23" height="23"
             xmlns="http://www.w3.org/2000/svg">
            <path
                d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
                fill="transparent"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    `;

    heart.addEventListener("click", event => {
        event.stopPropagation();

        const name = card.dataset.name;
        const index = favoriteCharacters.indexOf(name);

        if (index === -1) {
    favoriteCharacters.push(name);
    showFavoriteNotification(name);
} else {
    favoriteCharacters.splice(index, 1);
}

        localStorage.setItem(
            FAVORITES_KEY,
            JSON.stringify(favoriteCharacters)
        );

        updateFavorites();

        
    });

    card.appendChild(heart);
});

// Обновляем избранное
function updateFavorites() {
    // Обновляем сердечки
    document.querySelectorAll(".character-card").forEach(card => {
        const heart = card.querySelector(".favorite-toggle");
        if (!heart) return;

        const isFavorite = favoriteCharacters.includes(card.dataset.name);

        heart.setAttribute("aria-pressed", String(isFavorite));
        heart.setAttribute(
            "aria-label",
            isFavorite ? "Удалить из фаворитов" : "Добавить в фавориты"
        );
    });

    // Очищаем сетку избранного
    if (!favoritesGrid || !charactersGrid) return;

    favoritesGrid.innerHTML = "";

    favoriteCharacters.forEach(name => {
        const originalCard = [...charactersGrid.querySelectorAll(".character-card")]
            .find(card => card.dataset.name === name);

        if (!originalCard) return;

        const copy = originalCard.cloneNode(true);

       

        favoritesGrid.appendChild(copy);

        const heart = copy.querySelector(".favorite-toggle");

if (heart) {
    heart.addEventListener("click", event => {
        event.stopPropagation();

        const index = favoriteCharacters.indexOf(name);

        if (index !== -1) {
            favoriteCharacters.splice(index, 1);
        }

        localStorage.setItem(
            FAVORITES_KEY,
            JSON.stringify(favoriteCharacters)
        );

        updateFavorites();
    });
}
    });

    if (favoritesEmpty) {
        favoritesEmpty.hidden = favoritesGrid.children.length > 0;
    }
}

// Первоначальная загрузка
updateFavorites();


 
// ПЕРЕКЛЮЧЕНИЕ РАЗДЕЛОВ

const catalogSection = document.getElementById("catalog");
const seriesSection = document.getElementById("series");
const librarySection = document.getElementById("my-library");
const compassSection = document.getElementById("compass");
const heroSection = document.querySelector(".hero");

function switchSection(sectionName) {

    const showHero = ["home", "catalog"].includes(sectionName);

    // Чёрная шапка во вкладке «Фавориты»
const header = document.querySelector(".header");

if (header) {
    header.classList.toggle("header-dark", sectionName === "my-library");
}

    if (heroSection) {
        heroSection.hidden = !showHero;
    }

    if (catalogSection) {
    catalogSection.hidden = !["home", "catalog"].includes(sectionName);
}

    if (seriesSection) {
        seriesSection.hidden = sectionName !== "series";
    }

    if (librarySection) {
        librarySection.hidden = sectionName !== "my-library";
    }

    if (compassSection) {
        compassSection.hidden = sectionName !== "compass";
    }

   requestAnimationFrame(() => {

    if (sectionName === "catalog") {
        catalogSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } else {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

});
}



// Обработчики навигации

document.querySelectorAll(
    '.navigation a, .mobile-navigation a, .logo'
).forEach(link => {

    link.addEventListener("click", event => {


        const target = link.getAttribute("href");

        const sections = {
            "#home": "home",
            "#catalog": "catalog",
            "#series": "series",
            "#my-library": "my-library",
            "#compass": "compass"
        };

        if (sections[target]) {
            event.preventDefault();
            history.replaceState(null, "", target);
            switchSection(sections[target]);
        }

    });

});

// Открываем нужную вкладку при загрузке

const initialSection = {
    "#series": "series",
    "#my-library": "my-library",
    "#compass": "compass"
}[window.location.hash] || "home";

switchSection(initialSection);

    const searchInput = document.getElementById("characterSearch");
    const resetButton = document.getElementById("resetFilters");
    const resultsCount = document.getElementById("resultsCount");
    const toggleFilters = document.getElementById("toggleFilters");
    const filtersPanel = document.getElementById("filtersPanel");
    const emptyState = document.getElementById("emptyState");
    const grid = document.getElementById("charactersGrid");

   const cards = [...document.querySelectorAll("#charactersGrid .character-card")];

    const selectedGenres = new Set();
    const selectedTags = new Set();
    const selectedPlatforms = new Set();
    const selectedSpecial = new Set(); // 1. Добавили коллекцию для Special Edition
    let sortOrder = "new"; // По умолчанию 'new'

    function normalize(value) {
        return (value || "")
            .toLocaleLowerCase("ru")
            .replace(/#/g, "")
            .replace(/[ё]/g, "е")
            .replace(/[.,!?;:()[\]{}"'`]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getWords(value) {
        return normalize(value).split(/\s+/).filter(Boolean);
    }

    // Открытие/закрытие панели фильтров
    if (toggleFilters && filtersPanel) {
        toggleFilters.addEventListener("click", () => {
            const isOpen = toggleFilters.getAttribute("aria-expanded") === "true";
            toggleFilters.setAttribute("aria-expanded", String(!isOpen));
            filtersPanel.hidden = isOpen;
        });
    }

    // Универсальный обработчик кликов по кнопкам фильтров
    function setupFilterGroup(containerId, setCollection, isSingleChoice = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.querySelectorAll(".filter-option").forEach(button => {
            button.addEventListener("click", () => {
                const value = normalize(button.dataset.value);
                if (!value) return;

                if (isSingleChoice) {
                    container.querySelectorAll(".filter-option").forEach(btn => btn.classList.remove("active"));
                    button.classList.add("active");
                    sortOrder = value;
                } else {
                    if (setCollection.has(value)) {
                        setCollection.delete(value);
                        button.classList.remove("active");
                    } else {
                        setCollection.add(value);
                        button.classList.add("active");
                    }
                }
                filterCharacters();
            });
        });
    }

    setupFilterGroup("genreFilters", selectedGenres);
    setupFilterGroup("tagFilters", selectedTags);
    setupFilterGroup("platformFilters", selectedPlatforms);
    setupFilterGroup("specialFilters", selectedSpecial); // 2. Подключили фильтр Special Edition
    setupFilterGroup("orderFilters", null, true);


// Компактное отображение жанров и тегов
function setupExpandableFilters(containerId, visibleCount = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const options = [...container.querySelectorAll(".filter-option")];

    if (options.length <= visibleCount) return;

    const extraOptions = options.slice(visibleCount);

    extraOptions.forEach(button => {
        button.classList.add("is-extra");
    });

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "filter-option filter-more-toggle";
    toggleButton.textContent = `ЕЩЁ ${extraOptions.length} +`;
    toggleButton.setAttribute("aria-expanded", "false");

    options[visibleCount - 1].after(toggleButton);

    toggleButton.addEventListener("click", () => {
        const expanded = toggleButton.getAttribute("aria-expanded") === "true";

        if (expanded) {
            extraOptions.forEach(button => {
                button.classList.add("is-extra");
            });

            toggleButton.textContent = `ЕЩЁ ${extraOptions.length} +`;
            options[visibleCount - 1].after(toggleButton);
            toggleButton.setAttribute("aria-expanded", "false");
        } else {
            extraOptions.forEach(button => {
                button.classList.remove("is-extra");
            });

            toggleButton.textContent = "СВЕРНУТЬ −";
            container.appendChild(toggleButton);
            toggleButton.setAttribute("aria-expanded", "true");
        }
    });
}

setupExpandableFilters("genreFilters");
setupExpandableFilters("tagFilters");


    function filterCharacters() {
        const searchWords = getWords(searchInput?.value);
        let visible = 0;

        cards.forEach(card => {
            const name = normalize(card.dataset.name);
            const tags = normalize(card.dataset.tags);
            const genres = normalize(card.dataset.genres);
            const platforms = normalize(card.dataset.platforms);

            const searchableText = normalize(`${name} ${tags} ${genres} ${platforms}`);

            // Поиск по текстовому полю
            const matchesSearch = searchWords.every(word => searchableText.includes(word));

            // Жанры
            const matchesGenre = selectedGenres.size === 0 || [...selectedGenres].every(g => genres.includes(g));

            // Теги
            const matchesTags = selectedTags.size === 0 || [...selectedTags].every(t => tags.includes(t));

            // Платформы
            const matchesPlatforms = selectedPlatforms.size === 0 || [...selectedPlatforms].some(p => platforms.includes(p));

            // 3. Проверка для Special Edition (праздников)
            const matchesSpecial = selectedSpecial.size === 0 || [...selectedSpecial].some(s => tags.includes(s));

            const show = matchesSearch && matchesGenre && matchesTags && matchesPlatforms && matchesSpecial;

            card.hidden = !show;
            if (show) visible++;
        });

        // Сортировка карточек в DOM
        cards.sort((a, b) => {
            const dateA = new Date(a.dataset.date || "2026-01-01");
            const dateB = new Date(b.dataset.date || "2026-01-01");
            return sortOrder === "new" ? dateB - dateA : dateA - dateB;
        });

        cards.forEach(card => grid.appendChild(card));

        if (resultsCount) {
            resultsCount.textContent = `Найдено персонажей: ${visible}`;
        }
        if (emptyState) {
            emptyState.hidden = visible !== 0;
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterCharacters);
    }

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            selectedGenres.clear();
            selectedTags.clear();
            selectedPlatforms.clear();
            selectedSpecial.clear(); // 4. Очищаем праздники при сбросе фильтров
            sortOrder = "new";

            document.querySelectorAll(".filter-option").forEach(button => {
                button.classList.remove("active");
            });
            // Вернуть активную кнопку "Сначала новые" по умолчанию
            const defaultOrderBtn = document.querySelector("#orderFilters [data-value='new']");
            if (defaultOrderBtn) defaultOrderBtn.classList.add("active");

            filterCharacters();
        });
    }

    // Модальное окно
    const modal = document.getElementById("characterModal");
    const modalKicker = document.getElementById("modalKicker");
    const modalName = document.getElementById("modalName");
    const modalDescription = document.getElementById("modalDescription");
    let lastFocusedElement = null;

    function openModal(card, button) {
        if (!modal || !modalName || !modalKicker || !modalDescription) return;
        const name = card.dataset.name || "Персонаж";
        const series = card.dataset.series || "";
        const description = card.querySelector(".character-full-description");

        lastFocusedElement = button;
        modalName.textContent = name;
        
        // Возвращаем как было: серия с дефисами заглавными буквами
        modalKicker.textContent = series.replace(/-/g, " ").toUpperCase();
        
        modalDescription.innerHTML = description ? description.innerHTML : "";

        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        modal.querySelector(".modal-close")?.focus();
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (lastFocusedElement) lastFocusedElement.focus();
    }

// Открытие карточек в каталоге и избранном
document.addEventListener("click", event => {

    const button = event.target.closest(".character-open");

    if (!button) return;

    const card = button.closest(".character-card");

    if (card) {
        openModal(card, button);
    }

});

    if (modal) {
        modal.querySelectorAll("[data-close-modal]").forEach(element => {
            element.addEventListener("click", closeModal);
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal?.classList.contains("is-open")) {
            closeModal();
        }
    });

    filterCharacters();
});


