const FOODS = [
  { id: "burger", label: "Burger", emoji: "🍔" },
  { id: "fries", label: "Fries", emoji: "🍟" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "pasta", label: "Pasta", emoji: "🍝" },
  { id: "rice", label: "Rice", emoji: "🍚" },
  { id: "chicken", label: "Chicken", emoji: "🍗" },
  { id: "fish", label: "Fish", emoji: "🐟" },
  { id: "egg", label: "Egg", emoji: "🍳" },
  { id: "cucumber", label: "Cucumber", emoji: "🥒" },
  { id: "green-beans", label: "Green beans", emoji: "🫛" },
  { id: "carrot", label: "Carrot", emoji: "🥕" },
  { id: "broccoli", label: "Broccoli", emoji: "🥦" },
  { id: "salad", label: "Salad", emoji: "🥗" },
  { id: "soup", label: "Soup", emoji: "🥣" },
  { id: "taco", label: "Taco", emoji: "🌮" },
  { id: "pancakes", label: "Pancakes", emoji: "🥞" },
  { id: "apple", label: "Apple", emoji: "🍎" },
  { id: "strawberry", label: "Strawberry", emoji: "🍓" },
];

const STORAGE_KEY = "menu-picker.week.v1";
const foodById = new Map(FOODS.map((food) => [food.id, food]));
const foodShelf = document.querySelector("#food-shelf");
const foodTemplate = document.querySelector("#food-card-template");
const selectionMessage = document.querySelector("#selection-message");
const dayCards = [...document.querySelectorAll(".day-card")];
const dayLists = [...document.querySelectorAll(".day-list")];
let selectedFoodId = null;
let instanceCounter = 0;

function makePaletteCard(food) {
  const card = foodTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.foodId = food.id;
  card.setAttribute("aria-label", `Choose ${food.label}`);
  card.querySelector(".food-card__emoji").textContent = food.emoji;
  card.querySelector(".food-card__label").textContent = food.label;
  card.addEventListener("click", () => selectFood(food.id));
  return card;
}

function makePlannedCard(foodId, instanceId = null) {
  const food = foodById.get(foodId);
  if (!food) return null;

  const card = document.createElement("div");
  card.className = "food-card food-card--planned";
  card.dataset.foodId = food.id;
  card.dataset.instanceId = instanceId || `food-${Date.now()}-${instanceCounter++}`;
  card.setAttribute("role", "group");
  card.setAttribute("aria-label", `${food.label}. Drag to move.`);

  const emoji = document.createElement("span");
  emoji.className = "food-card__emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = food.emoji;

  const label = document.createElement("span");
  label.className = "food-card__label";
  label.textContent = food.label;

  card.append(emoji, label);

  const removeButton = document.createElement("button");
  removeButton.className = "food-card__remove";
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", `Remove ${food.label}`);
  removeButton.addEventListener("pointerdown", (event) => event.stopPropagation());
  removeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    card.remove();
    saveWeek();
  });
  card.append(removeButton);

  return card;
}

function normalizeDroppedCard(card) {
  const foodId = card.dataset.foodId;
  const replacement = makePlannedCard(foodId, card.dataset.instanceId || null);
  if (replacement) card.replaceWith(replacement);
}

function renderFoodShelf() {
  const fragment = document.createDocumentFragment();
  FOODS.forEach((food) => fragment.append(makePaletteCard(food)));
  foodShelf.append(fragment);
}

function selectFood(foodId) {
  selectedFoodId = selectedFoodId === foodId ? null : foodId;

  document.querySelectorAll(".food-card--palette").forEach((card) => {
    const isSelected = card.dataset.foodId === selectedFoodId;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });

  dayCards.forEach((card) => card.classList.toggle("is-tap-target", Boolean(selectedFoodId)));

  if (selectedFoodId) {
    selectionMessage.textContent = `${foodById.get(selectedFoodId).label} selected — now tap a day.`;
  } else {
    selectionMessage.textContent = "Pick something delicious.";
  }
}

function addSelectedFoodToDay(dayCard) {
  if (!selectedFoodId) return;
  const card = makePlannedCard(selectedFoodId);
  if (card) {
    dayCard.querySelector(".day-list").append(card);
    saveWeek();
  }
  selectFood(null);
}

function getWeekState() {
  return Object.fromEntries(
    dayCards.map((dayCard) => {
      const foods = [...dayCard.querySelectorAll(".food-card--planned")].map((card) => ({
        foodId: card.dataset.foodId,
        instanceId: card.dataset.instanceId,
      }));
      return [dayCard.dataset.day, foods];
    }),
  );
}

function saveWeek() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getWeekState()));
}

function loadWeek() {
  let savedWeek;
  try {
    savedWeek = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  if (!savedWeek || typeof savedWeek !== "object") return;

  dayCards.forEach((dayCard) => {
    const dayList = dayCard.querySelector(".day-list");
    const savedFoods = Array.isArray(savedWeek[dayCard.dataset.day])
      ? savedWeek[dayCard.dataset.day]
      : [];

    savedFoods.forEach(({ foodId, instanceId }) => {
      const card = makePlannedCard(foodId, instanceId);
      if (card) dayList.append(card);
    });
  });
}

function initializeDragging() {
  if (typeof Sortable === "undefined") {
    selectionMessage.textContent = "Drag is unavailable, but tap-to-place still works.";
    return;
  }

  Sortable.create(foodShelf, {
    group: { name: "weekly-menu", pull: "clone", put: false },
    sort: false,
    animation: 170,
    fallbackOnBody: true,
    fallbackTolerance: 4,
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
  });

  dayLists.forEach((dayList) => {
    Sortable.create(dayList, {
      group: { name: "weekly-menu", pull: true, put: true },
      animation: 170,
      fallbackOnBody: true,
      fallbackTolerance: 4,
      emptyInsertThreshold: 34,
      swapThreshold: 0.65,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onAdd(event) {
        normalizeDroppedCard(event.item);
        event.to.closest(".day-card").classList.remove("is-drag-over");
        saveWeek();
      },
      onUpdate: saveWeek,
      onRemove: saveWeek,
      onMove(event) {
        dayCards.forEach((card) => card.classList.remove("is-drag-over"));
        event.to.closest(".day-card")?.classList.add("is-drag-over");
      },
      onEnd() {
        dayCards.forEach((card) => card.classList.remove("is-drag-over"));
        saveWeek();
      },
    });
  });
}

function resetWeek() {
  const hasFood = document.querySelector(".food-card--planned");
  if (hasFood && !window.confirm("Clear every day and start a new week?")) return;

  dayLists.forEach((list) => list.replaceChildren());
  localStorage.removeItem(STORAGE_KEY);
  selectFood(null);
}

dayCards.forEach((dayCard) => {
  dayCard.addEventListener("click", (event) => {
    if (event.target.closest(".food-card")) return;
    addSelectedFoodToDay(dayCard);
  });
});

document.querySelector("#reset-week").addEventListener("click", resetWeek);

renderFoodShelf();
loadWeek();
initializeDragging();
