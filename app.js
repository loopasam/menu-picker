const FOODS = [
  { id: "cucumber", label: "Cucumber", emoji: "🥒", group: "veggies" },
  { id: "green-beans", label: "Green beans", emoji: "🫛", group: "veggies" },
  { id: "carrot", label: "Carrot", emoji: "🥕", group: "veggies" },
  { id: "broccoli", label: "Broccoli", emoji: "🥦", group: "veggies" },
  { id: "salad", label: "Salad", emoji: "🥗", group: "veggies" },
  { id: "peas", label: "Peas", emoji: "🟢", group: "veggies" },
  { id: "edamame", label: "Edamame", emoji: "🫛", group: "veggies" },
  { id: "cherry-tomatoes", label: "Cherry tomatoes", emoji: "🍅🍅", group: "veggies" },
  { id: "chicken", label: "Chicken", emoji: "🍗", group: "protein" },
  { id: "fish", label: "Fish", emoji: "🐟", group: "protein" },
  { id: "egg", label: "Egg", emoji: "🍳", group: "protein" },
  { id: "hot-dog", label: "Hot dog", emoji: "🌭", group: "protein" },
  { id: "sausages", label: "Sausages", emoji: "🌭🌭", group: "protein" },
  { id: "pork", label: "Pork", emoji: "🐷", group: "protein" },
  { id: "fries", label: "Fries", emoji: "🍟", group: "carbs" },
  { id: "pasta", label: "Pasta", emoji: "🍝", group: "carbs" },
  { id: "rice", label: "Rice", emoji: "🍚", group: "carbs" },
  { id: "pancakes", label: "Pancakes", emoji: "🥞", group: "carbs" },
  { id: "ebly", label: "Ebly", emoji: "🌾", group: "carbs" },
  { id: "couscous", label: "Couscous", emoji: "🥣", group: "carbs" },
  { id: "rosti", label: "Rösti", emoji: "🥔", group: "carbs" },
  { id: "burger", label: "Burger", emoji: "🍔", group: "meals" },
  { id: "pizza", label: "Pizza", emoji: "🍕", group: "meals" },
  { id: "soup", label: "Soup", emoji: "🥣", group: "meals" },
  { id: "taco", label: "Taco", emoji: "🌮", group: "meals" },
  { id: "fried-rice", label: "Fried rice", emoji: "🍚", group: "meals" },
  { id: "apple", label: "Apple", emoji: "🍎", group: "fruit" },
  { id: "strawberry", label: "Strawberry", emoji: "🍓", group: "fruit" },
  { id: "grapes", label: "Grapes", emoji: "🍇", group: "fruit" },
  { id: "melon", label: "Melon", emoji: "🍈", group: "fruit" },
  { id: "watermelon", label: "Watermelon", emoji: "🍉", group: "fruit" },
  { id: "blueberries", label: "Blueberries", emoji: "🫐", group: "fruit" },
  { id: "raspberries", label: "Raspberries", icon: "raspberry.svg", group: "fruit" },
  { id: "peaches-nectarines", label: "Peaches / Nectarines", emoji: "🍑", group: "fruit" },
  { id: "banana", label: "Banana", emoji: "🍌", group: "fruit" },
  { id: "kiwi", label: "Kiwi", emoji: "🥝", group: "fruit" },
  { id: "pear", label: "Pear", emoji: "🍐", group: "fruit" },
];

const FOOD_GROUPS = [
  { id: "veggies", label: "Veggies", emoji: "🥦", hint: "Fill the plate" },
  { id: "protein", label: "Protein", emoji: "🍳", hint: "Helps us grow" },
  { id: "carbs", label: "Carbs", emoji: "🍚", hint: "Energy foods" },
  { id: "meals", label: "Meals", emoji: "🍽️", hint: "All-in-one favorites" },
  { id: "fruit", label: "Fruit", emoji: "🍓", hint: "Something fresh" },
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

function setFoodIcon(container, food) {
  if (!food.icon) {
    container.textContent = food.emoji;
    return;
  }

  const image = document.createElement("img");
  image.src = food.icon;
  image.alt = "";
  image.draggable = false;
  container.replaceChildren(image);
}

function makePaletteCard(food) {
  const card = foodTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.foodId = food.id;
  card.setAttribute("aria-label", `Choose ${food.label}`);
  setFoodIcon(card.querySelector(".food-card__emoji"), food);
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
  setFoodIcon(emoji, food);

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

  FOOD_GROUPS.forEach((group) => {
    const groupSection = document.createElement("section");
    groupSection.className = `food-group food-group--${group.id}`;
    groupSection.dataset.foodGroup = group.id;

    const header = document.createElement("header");
    header.className = "food-group__header";
    header.innerHTML = `
      <span class="food-group__emoji" aria-hidden="true">${group.emoji}</span>
      <div>
        <h3>${group.label}</h3>
        <p>${group.hint}</p>
      </div>
    `;

    const items = document.createElement("div");
    items.className = "food-group__items";
    items.setAttribute("aria-label", `${group.label} foods`);

    FOODS.filter((food) => food.group === group.id).forEach((food) => {
      items.append(makePaletteCard(food));
    });

    groupSection.append(header, items);
    fragment.append(groupSection);
  });

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
    selectionMessage.textContent = "Choose from every food group.";
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

  document.querySelectorAll(".food-group__items").forEach((groupItems) => {
    Sortable.create(groupItems, {
      group: { name: "weekly-menu", pull: "clone", put: false },
      sort: false,
      animation: 170,
      fallbackOnBody: true,
      fallbackTolerance: 4,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
    });
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
document.querySelector("#print-week").addEventListener("click", () => window.print());

renderFoodShelf();
loadWeek();
initializeDragging();
