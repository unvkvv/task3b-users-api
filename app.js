"use strict";

// Практическое задание 3Б. REST API: пользователи и публикации.
// Тест ошибки HTTP 404: временно замените /users на /userz в USERS_URL.
// После теста верните корректный адрес перед сдачей.
const USERS_URL = "https://jsonplaceholder.typicode.com/users";
const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const loadUsersBtn = document.getElementById("loadUsersBtn");
const retryUsersBtn = document.getElementById("retryUsersBtn");
const searchInput = document.getElementById("searchInput");
const usersStatus = document.getElementById("usersStatus");
const usersCount = document.getElementById("usersCount");
const usersList = document.getElementById("usersList");
const postsStatus = document.getElementById("postsStatus");
const postsList = document.getElementById("postsList");
const retryPostsBtn = document.getElementById("retryPostsBtn");

let allUsers = [];
let activeUserId = null;
let postsLoading = false;

function setStatus(element, message, type = "neutral") {
  element.textContent = message;
  element.className = `notice notice-${type}`;
}

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function renderUsers() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filteredUsers = allUsers.filter((user) =>
    user.name.toLocaleLowerCase().includes(query)
  );

  usersList.replaceChildren();
  usersCount.textContent = `Найдено: ${filteredUsers.length} из ${allUsers.length}`;

  if (filteredUsers.length === 0 && allUsers.length > 0) {
    setStatus(usersStatus, "Пользователи не найдены.");
    return;
  }

  if (allUsers.length > 0) {
    setStatus(usersStatus, `Загружено пользователей: ${allUsers.length}.`, "success");
  }

  filteredUsers.forEach((user) => {
    const card = document.createElement("article");
    card.className = "user-card";

    const info = document.createElement("div");
    info.className = "user-main";

    const name = document.createElement("h3");
    name.className = "user-name";
    name.textContent = user.name;

    const email = document.createElement("p");
    email.className = "user-meta";
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.className = "user-meta";
    city.textContent = `Город: ${user.address.city}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-outline";
    button.textContent = "Показать публикации";
    button.disabled = postsLoading;
    button.addEventListener("click", () => loadPosts(user.id, user.name));

    info.append(name, email, city);
    card.append(info, button);
    usersList.appendChild(card);
  });
}

async function loadUsers() {
  loadUsersBtn.disabled = true;
  retryUsersBtn.classList.add("hidden");
  searchInput.disabled = true;
  searchInput.value = "";
  allUsers = [];
  usersList.replaceChildren();
  usersCount.textContent = "Найдено: 0";
  setStatus(usersStatus, "Загрузка пользователей...");

  try {
    const data = await requestJson(USERS_URL);
    if (!Array.isArray(data)) throw new Error("Некорректный формат данных");
    allUsers = data;
    searchInput.disabled = false;
    if (data.length === 0) {
      setStatus(usersStatus, "Список пользователей пуст.");
    } else {
      renderUsers();
    }
  } catch (error) {
    setStatus(usersStatus, `Не удалось загрузить пользователей: ${error.message}.`, "error");
    retryUsersBtn.classList.remove("hidden");
  } finally {
    loadUsersBtn.disabled = false;
  }
}

async function loadPosts(userId, userName) {
  if (postsLoading) return;
  postsLoading = true;
  activeUserId = { id: userId, name: userName };
  postsList.replaceChildren();
  retryPostsBtn.classList.add("hidden");
  setStatus(postsStatus, `Загрузка публикаций: ${userName}...`);
  usersList.querySelectorAll("button").forEach((button) => { button.disabled = true; });

  try {
    const data = await requestJson(`${POSTS_URL}?userId=${encodeURIComponent(userId)}`);
    if (!Array.isArray(data)) throw new Error("Некорректный формат данных");
    const firstThree = data.slice(0, 3);

    if (firstThree.length === 0) {
      setStatus(postsStatus, `У пользователя ${userName} публикаций нет.`);
      return;
    }

    firstThree.forEach((post, index) => {
      const card = document.createElement("article");
      card.className = "post-card";
      const label = document.createElement("div");
      label.className = "post-label";
      label.textContent = `Публикация ${index + 1} · ID ${post.id}`;
      const title = document.createElement("h3");
      title.className = "post-title";
      title.textContent = post.title;
      const body = document.createElement("p");
      body.className = "post-body";
      body.textContent = post.body;
      card.append(label, title, body);
      postsList.appendChild(card);
    });
    setStatus(postsStatus, `Публикации пользователя ${userName}: показано ${firstThree.length}.`, "success");
  } catch (error) {
    setStatus(postsStatus, `Не удалось загрузить публикации: ${error.message}.`, "error");
    retryPostsBtn.classList.remove("hidden");
  } finally {
    postsLoading = false;
    usersList.querySelectorAll("button").forEach((button) => { button.disabled = false; });
  }
}

loadUsersBtn.addEventListener("click", loadUsers);
retryUsersBtn.addEventListener("click", loadUsers);
searchInput.addEventListener("input", renderUsers);
retryPostsBtn.addEventListener("click", () => {
  if (activeUserId) loadPosts(activeUserId.id, activeUserId.name);
});
