(function () {
  "use strict";

  var sections = window.PHARM_SECTIONS;
  var medicineBanks = window.PHARM_DRUG_QUESTIONS;
  var app = document.getElementById("app");
  var themeToggle = document.getElementById("theme-toggle");
  var mixedLength = 60;
  var medicineQuickLength = 40;
  var sectionQuickLength = 30;
  var medicineTopic = {
    id: "medicines",
    title: "Препараты и их группы",
    description: "Лекарственные группы, действующие вещества и торговые названия из всех шести конспектов.",
    modeTitle: "Весь тест",
    modeDescription: "Все вопросы из банка в случайном порядке.",
    icon: "capsule",
    theme: "lilac",
    questions: []
  };
  var definitionsTopic = {
    id: "definitions",
    title: "Определения",
    description: "Подберите термин к каждому определению из файла к зачёту.",
    icon: "book",
    theme: "sky",
    questions: window.PHARM_DEFINITION_QUESTIONS
  };
  var mixed = {
    id: "mixed",
    title: "Смешанный тест",
    description: "Теория, препараты и определения из всех разделов. Ответы после завершения.",
    icon: "shuffle",
    theme: "mint"
  };
  var fullSectionTopics = sections.map(function (section) {
    return Object.assign({}, section, {
      modeTitle: "Весь тест",
      modeDescription: "Все вопросы раздела в случайном порядке.",
      questions: section.questions.concat(medicineBanks[section.id])
    });
  });
  var sectionsWithModes = [medicineTopic].concat(fullSectionTopics);
  var sectionCards = [definitionsTopic].concat(sectionsWithModes);
  var modesBySection = Object.create(null);
  var topics = [definitionsTopic];
  sectionsWithModes.forEach(function (full) {
    var isMedicine = full.id === medicineTopic.id;
    var quick = {
      id: full.id + "-quick",
      parentId: full.id,
      title: full.title,
      description: "Новая случайная подборка из вопросов раздела при каждой попытке.",
      modeTitle: "Случайная подборка",
      icon: "shuffle",
      theme: isMedicine ? "sky" : full.theme,
      questions: full.questions,
      limit: isMedicine ? medicineQuickLength : sectionQuickLength
    };
    modesBySection[full.id] = [quick, full];
    topics.push(quick, full);
  });
  topics.push(mixed);
  var topicById = Object.create(null);
  var questionById = Object.create(null);
  var profileRecords = Object.create(null);
  var profileIdentities = Object.create(null);
  var storagePrefix = "pharmtest:v1:";
  var profilePrefix = "pharmtest:profile:v1:";
  var profileCodePrefix = "pharmtest:profile-code:v1:";
  var selectedProfileKey = "pharmtest:selected-profile:v1";
  var codeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  var codePattern = /^[2-9A-HJ-NP-Z]{16}$/;
  var defaultProfile = { id: "default", name: "Мой профиль" };
  var profiles = [defaultProfile];
  var activeProfileId = defaultProfile.id;
  var records;
  var themeKey = "pharmtest:theme";
  var storageAvailable = true;
  var previousTheoryLength = 40;
  var previousSectionLength = 18;
  var previousMixedLength = 12;
  var letters = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

  var mascotMessages = {
    happy: [
      "Вы молодец! Все ответы верны. Отличная работа.",
      "Поздравляю с полным баллом! Вы уверенно справились со всеми вопросами.",
      "Ни одной ошибки! Вы хорошо разобрались в этом материале.",
      "Вы справились на отлично. Можно с уверенностью переходить к следующей теме.",
      "Все ответы на месте. Рад за вас! Отметьте этот результат и продолжайте в своём темпе.",
      "Получилось на все сто! Вспомните, какие вопросы раньше казались сложными, и порадуйтесь прогрессу.",
      "Мне есть за что вас похвалить. Вы ответили правильно на каждый вопрос!",
      "Отличный результат! Вы успешно применили то, что повторяли.",
      "Всё верно! Вы внимательно прочитали вопросы и справились с каждым из них.",
      "Поздравляю! Хорошая подготовка помогла вам набрать полный балл.",
      "Прекрасно получилось. Попробуйте объяснить самый сложный ответ своими словами, чтобы закрепить его.",
      "Сегодня вы отлично поработали. Все ответы верны!",
      "Рад видеть такой результат! Вы можете возвращаться к этой теме для короткого повторения.",
      "Вы здорово справились. Возьмите небольшую паузу и выбирайте следующую тему.",
      "Поздравляю с отличным прохождением! Ни один вопрос не остался без верного ответа.",
      "Вы заслужили похвалу. С полным баллом можно смело двигаться дальше."
    ],
    practice: [
      "Посмотрите разбор ошибок и повторите нужные места в конспекте. В следующий раз будет проще.",
      "У вас получится. Начните с одного вопроса, который вызвал сомнение, и разберите его по шагам.",
      "Возьмите небольшую паузу. Потом перечитайте тему и попробуйте ответить ещё раз.",
      "Теперь вы знаете, к каким темам стоит вернуться. Повторите их в удобном темпе.",
      "Попробуйте объяснить правильные ответы своими словами. Так их проще вспомнить в следующей попытке.",
      "Вы уже сделали первый шаг. Выберите вопросы с ошибками и потренируйтесь на них ещё раз.",
      "Отметьте понятия, которые перепутали. Короткое повторение поможет различать их увереннее.",
      "Сравните свои ответы с пояснениями. Затем дайте себе время повторить материал.",
      "Начните с вопроса, который оказался самым трудным. Я верю, что вы с ним разберётесь.",
      "Возвращайтесь к темам по одной. После повторения попробуйте пройти тест ещё раз.",
      "Повторите определения, которые вызвали затруднения. Следующая попытка покажет ваш прогресс.",
      "Разберите один или два ответа сейчас, а к остальным вернитесь чуть позже. У вас есть время освоить тему.",
      "Посмотрите, в каких вопросах вы сомневались. Прочитайте пояснения и попробуйте вспомнить ответы без подсказки.",
      "Потренируйтесь на вопросах с ошибками. С повторением вы будете отвечать увереннее.",
      "Сделайте заметку о том, что хотите повторить. В следующий раз начните с неё.",
      "Спасибо, что дошли до конца. Повторите трудные темы и дайте себе ещё одну попытку."
    ]
  };

  var paths = {
    capsule: '<path d="M8.3 4.8a5.6 5.6 0 0 1 7.9 7.9l-3.5 3.5a5.6 5.6 0 0 1-7.9-7.9l3.5-3.5ZM6.6 6.6l7.9 7.9" transform="translate(1.5 1.5)"/>',
    flask: '<path d="M9 3h6m-5 0v6L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M8 15h8m-6 3h.01m3-2h.01"/>',
    file: '<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Zm0 0v6h6M8.5 13h7m-7 4h7"/>',
    pulse: '<path d="M2.5 12h4l2.6-6 4.1 12 2.8-7h5.5M3 5h.01M21 19h.01"/>',
    brain: '<path d="M12 5a3 3 0 0 0-5.8-1.1 3.4 3.4 0 0 0-2.6 4.7 3.5 3.5 0 0 0 0 5.8 3.5 3.5 0 0 0 3.2 4.5 2.8 2.8 0 0 0 5.2-.9m0-13a3 3 0 0 1 5.8-1.1 3.4 3.4 0 0 1 2.6 4.7 3.5 3.5 0 0 1 0 5.8 3.5 3.5 0 0 1-3.2 4.5 2.8 2.8 0 0 1-5.2-.9m0-13v13M7 8a2.5 2.5 0 0 0 2.5 2.5M17 8a2.5 2.5 0 0 1-2.5 2.5M7 15a2.5 2.5 0 0 1 2.5-2.5M17 15a2.5 2.5 0 0 0-2.5-2.5"/>',
    heart: '<path d="M20.8 5.9a4.6 4.6 0 0 0-6.5 0L12 8.2 9.7 5.9a4.6 4.6 0 0 0-6.5 6.5l8.8 8.1 8.8-8.1a4.6 4.6 0 0 0 0-6.5Z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>',
    microbe: '<path d="M18.4 5.6a5.5 5.5 0 0 1 0 7.8l-5 5a5.5 5.5 0 1 1-7.8-7.8l5-5a5.5 5.5 0 0 1 7.8 0ZM17 4l1-2m2 6 2-1m-3 7 2 2M8 20l-1 2m-3-6-2 1m3-7-2-2m8-2-1-3"/><path d="M9 15h.01m3-3h.01m3-3h.01"/>',
    shuffle: '<path d="M3 6h2c6.5 0 7.5 12 14 12h2m-4-4 4 4-4 4M3 18h2c2.2 0 3.8-1.4 5.1-3.1m3.8-5.8C15.2 7.4 16.8 6 19 6h2m-4-4 4 4-4 4"/>',
    book: '<path d="M12 7c-2-1.6-5.1-2.3-9-1.7v12c3.9-.6 7 .1 9 1.7 2-1.6 5.1-2.3 9-1.7v-12c-3.9-.6-7 .1-9 1.7Zm0 0v12"/>',
    right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    left: '<path d="M20 12H5m6 6-6-6 6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    cross: '<path d="m6 6 12 12M18 6 6 18"/>',
    minus: '<path d="M5 12h14"/>',
    flag: '<path d="M5 21V4m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
    repeat: '<path d="M5 10a7 7 0 1 1 1.3 7.5M5 5v5h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    moon: '<path d="M20.8 14.5A9 9 0 0 1 9.5 3.2a9 9 0 1 0 11.3 11.3Z"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'
  };

  function icon(name, small) {
    return '<svg class="icon' + (small ? ' icon-sm' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
  }

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function heroAsset() {
    return "./assets/" + (isDarkTheme() ? "capsule-dark" : "capsule");
  }

  function applyTheme(theme) {
    var dark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]').content = dark ? "#0d1322" : "#f7f8f3";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.title = dark ? "Включить светлую тему" : "Включить тёмную тему";
    themeToggle.innerHTML = icon(dark ? "sun" : "moon", true);
    themeToggle.hidden = false;
    var picture = app.querySelector(".hero-picture");
    if (picture) {
      var asset = heroAsset();
      picture.querySelector("source").srcset = asset + ".webp";
      picture.querySelector("img").src = asset + ".jpg";
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function countLabel(count, singular, few, many) {
    var tens = count % 100;
    var ones = count % 10;
    var word = many;
    if (tens < 11 || tens > 14) {
      if (ones === 1) word = singular;
      if (ones >= 2 && ones <= 4) word = few;
    }
    return count + " " + word;
  }

  function questionsLabel(count) {
    return countLabel(count, "вопрос", "вопроса", "вопросов");
  }

  function percent(value, total) {
    if (value === total) return 100;
    return Math.min(99, Math.round(value * 100 / total));
  }

  function shuffle(values) {
    var shuffled = values.slice();
    for (var index = shuffled.length - 1; index > 0; index -= 1) {
      var other = Math.floor(Math.random() * (index + 1));
      var item = shuffled[index];
      shuffled[index] = shuffled[other];
      shuffled[other] = item;
    }
    return shuffled;
  }

  sections.forEach(function (section) {
    section.questions.forEach(function (question) {
      questionById[question.id] = { question: question, section: section };
    });
    medicineBanks[section.id].forEach(function (question) {
      questionById[question.id] = { question: question, section: section, medicine: true };
      medicineTopic.questions.push(question);
    });
  });
  definitionsTopic.questions.forEach(function (question) {
    questionById[question.id] = { question: question, section: definitionsTopic };
    questionById[question.previous.id] = {
      question: question.previous,
      section: definitionsTopic,
      replacementId: question.id
    };
  });

  topics.forEach(function (topic) {
    topicById[topic.id] = topic;
  });
  profiles = readProfiles();
  activeProfileId = readSelectedProfile();
  records = loadProfileRecords(activeProfileId);
  rememberTabProfile(activeProfileId);
  profiles.forEach(function (profile) { profileIdentity(profile.id); });

  function topicTotal(topicId) {
    if (topicId === mixed.id) return mixedLength;
    var topic = topicById[topicId];
    return topic.limit ? Math.min(topic.limit, topic.questions.length) : topic.questions.length;
  }

  function isFullLength(length, topicId) {
    if (length === topicTotal(topicId)) return true;
    if (topicId === mixed.id) return length === previousMixedLength;
    if (!medicineBanks[topicId]) return false;
    return length === previousSectionLength || length === previousTheoryLength ||
      length === previousTheoryLength + medicineBanks[topicId].length;
  }

  function isLegacyMixedAttempt(topicId, attempt) {
    return topicId === mixed.id && !attempt.review && attempt.steps.length === previousMixedLength;
  }

  function isScore(value, total) {
    return Number.isInteger(value) && value >= 0 && value <= total;
  }

  function belongsToTopic(entry, topicId) {
    if (topicId === mixed.id) return true;
    var sectionId = topicById[topicId].parentId || topicId;
    return sectionId === medicineTopic.id ? entry.medicine : entry.section.id === sectionId;
  }

  function validAttempt(attempt, topicId) {
    if (!attempt || typeof attempt.review !== "boolean" || typeof attempt.complete !== "boolean" ||
        !Array.isArray(attempt.steps) || !attempt.steps.length || attempt.steps.length > topicTotal(topicId) ||
        (!attempt.review && !isFullLength(attempt.steps.length, topicId)) ||
        !isScore(attempt.cursor, attempt.steps.length - 1) ||
        (attempt.complete && attempt.selected !== null)) return false;

    var seen = Object.create(null);
    return attempt.steps.every(function (step, index) {
      var entry = step && questionById[step.id];
      if (!entry || !belongsToTopic(entry, topicId)) return false;
      var questionId = entry.replacementId || step.id;
      if (seen[questionId]) return false;
      seen[questionId] = true;
      var limit = entry.question.options.length - 1;
      if (!Array.isArray(step.order) || step.order.length !== limit + 1 ||
          !step.order.every(function (position, positionIndex) {
            return isScore(position, limit) && step.order.indexOf(position) === positionIndex;
          })) return false;
      var answered = isScore(step.answer, limit);
      if (index < attempt.cursor) return answered;
      if (index > attempt.cursor) return step.answer === null;
      if (!answered && step.answer !== null) return false;
      return attempt.selected === null || (!answered && isScore(attempt.selected, limit));
    });
  }

  function parseRecord(raw, topicId) {
    var total = topicTotal(topicId);
    var record = { attempt: null, stats: { count: 0, last: 0, lastTotal: total, best: 0, bestTotal: total } };
    if (!raw) return record;
    var saved;
    try {
      saved = JSON.parse(raw);
    } catch (error) {
      return record;
    }
    if (!saved || typeof saved !== "object") return record;
    var stats = saved.stats;
    if (stats && Number.isInteger(stats.count) && stats.count > 0) {
      var priorTotal = topicId === mixed.id ? previousMixedLength : previousSectionLength;
      var lastTotal = stats.lastTotal === undefined ? priorTotal : stats.lastTotal;
      var bestTotal = stats.bestTotal === undefined ? priorTotal : stats.bestTotal;
      if (isFullLength(lastTotal, topicId) && isFullLength(bestTotal, topicId) &&
          isScore(stats.last, lastTotal) && isScore(stats.best, bestTotal) &&
          stats.best * lastTotal >= stats.last * bestTotal) {
        record.stats = { count: stats.count, last: stats.last, lastTotal: lastTotal, best: stats.best, bestTotal: bestTotal };
      }
    }
    if (validAttempt(saved.attempt, topicId)) record.attempt = saved.attempt;
    return record;
  }

  function findProfile(id) {
    return profiles.find(function (profile) { return profile.id === id; });
  }

  function readProfiles() {
    if (!storageAvailable) return profiles;
    var saved = [];
    try {
      var storage = window.localStorage;
      for (var index = 0; index < storage.length; index += 1) {
        var key = storage.key(index);
        if (!key || key.indexOf(profilePrefix) !== 0) continue;
        var id = key.slice(profilePrefix.length);
        if (id === defaultProfile.id || !/^[a-z0-9-]{1,64}$/.test(id)) continue;
        var name = storage.getItem(key);
        if (name && name.trim() && name.length <= 32) saved.push({ id: id, name: name.trim() });
      }
    } catch (error) {
      storageAvailable = false;
      return profiles;
    }
    saved.sort(function (a, b) { return a.name.localeCompare(b.name, "ru"); });
    return [defaultProfile].concat(saved);
  }

  function readSelectedProfile() {
    var id;
    try {
      id = window.sessionStorage.getItem(selectedProfileKey);
    } catch (error) {}
    if (findProfile(id)) return id;
    if (storageAvailable) {
      try {
        id = window.localStorage.getItem(selectedProfileKey);
      } catch (error) {
        storageAvailable = false;
      }
      if (findProfile(id)) return id;
    }
    return defaultProfile.id;
  }

  function rememberTabProfile(id) {
    try {
      window.sessionStorage.setItem(selectedProfileKey, id);
    } catch (error) {}
  }

  function recordPrefix(profileId) {
    return profileId === defaultProfile.id ? storagePrefix : storagePrefix + profileId + ":";
  }

  function loadProfileRecords(profileId) {
    var loaded = profileRecords[profileId] || Object.create(null);
    var prefix = recordPrefix(profileId);
    topics.forEach(function (topic) {
      if (storageAvailable) {
        try {
          loaded[topic.id] = parseRecord(window.localStorage.getItem(prefix + topic.id), topic.id);
        } catch (error) {
          storageAvailable = false;
        }
      }
      if (!loaded[topic.id]) loaded[topic.id] = parseRecord(null, topic.id);
    });
    profileRecords[profileId] = loaded;
    return loaded;
  }

  function selectProfile(id) {
    if (id === activeProfileId || !findProfile(id)) return;
    activeProfileId = id;
    records = loadProfileRecords(id);
    rememberTabProfile(id);
    if (storageAvailable) {
      try {
        window.localStorage.setItem(selectedProfileKey, id);
      } catch (error) {
        storageAvailable = false;
      }
    }
    renderPage("profile-select", false);
  }

  function submitProfile() {
    var input = document.getElementById("profile-name");
    var name = input.value.trim();
    var message = "";
    profiles = readProfiles();
    if (!name || name.length > 32) message = "Введите имя профиля длиной до 32 символов.";
    else if (profiles.some(function (profile) { return profile.name.toLowerCase() === name.toLowerCase(); })) {
      message = "Профиль с таким именем уже есть.";
    }
    if (message) {
      input.setCustomValidity(message);
      input.reportValidity();
      return;
    }
    addProfile(name);
  }

  function addProfile(name, imported) {
    var id = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    var importedRecords = Object.create(null);
    if (imported) {
      topics.forEach(function (topic) {
        var record = parseRecord(JSON.stringify(imported[topic.id]), topic.id);
        if (record.attempt || record.stats.count) importedRecords[topic.id] = record;
      });
      profileRecords[id] = importedRecords;
    }
    profiles.push({ id: id, name: name });
    if (storageAvailable) {
      try {
        Object.keys(importedRecords).forEach(function (topicId) {
          window.localStorage.setItem(recordPrefix(id) + topicId, JSON.stringify(importedRecords[topicId]));
        });
        window.localStorage.setItem(profilePrefix + id, name);
      } catch (error) {
        storageAvailable = false;
      }
    }
    profileIdentity(id);
    selectProfile(id);
  }

  function profileIdentity(profileId, renew) {
    var key = profileCodePrefix + profileId;
    if (!renew && storageAvailable) {
      try {
        var saved = JSON.parse(window.localStorage.getItem(key));
        if (saved && typeof saved.code === "string" && typeof saved.writeKey === "string" &&
            codePattern.test(saved.code) && /^[a-f0-9]{32}$/.test(saved.writeKey)) {
          profileIdentities[profileId] = saved;
          return saved;
        }
      } catch (error) {}
    }
    if (!renew && profileIdentities[profileId]) return profileIdentities[profileId];
    if (!window.crypto || typeof window.crypto.getRandomValues !== "function") return null;

    var bytes = window.crypto.getRandomValues(new Uint8Array(32));
    var identity = {
      code: Array.from(bytes.subarray(0, 16), function (byte) { return codeAlphabet[byte % 32]; }).join(""),
      writeKey: Array.from(bytes.subarray(16), function (byte) { return byte.toString(16).padStart(2, "0"); }).join("")
    };
    profileIdentities[profileId] = identity;
    if (storageAvailable) {
      try { window.localStorage.setItem(key, JSON.stringify(identity)); } catch (error) {}
    }
    return identity;
  }

  async function profileRequest(payload) {
    var endpoint = document.querySelector('meta[name="profile-code-endpoint"]').content;
    var response = await window.fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { status: response.status, data: await response.json() };
  }

  async function shareProfile(button) {
    var profile = findProfile(activeProfileId);
    var identity = profileIdentity(profile.id);
    var panel = document.getElementById("profile-share");
    var output = document.getElementById("profile-share-code");
    var codeRow = document.getElementById("profile-code-row");
    var status = document.getElementById("profile-share-status");
    panel.hidden = false;
    codeRow.hidden = true;
    if (!identity) {
      status.textContent = "В этом браузере не удалось создать код профиля.";
      return;
    }
    var snapshot = { version: 1, name: profile.name, records: Object.create(null) };
    topics.forEach(function (topic) {
      var record = records[topic.id];
      if (record.attempt || record.stats.count) snapshot.records[topic.id] = record;
    });
    var payload = { action: "share", code: identity.code, writeKey: identity.writeKey, profile: snapshot };
    button.disabled = true;
    status.textContent = "Сохраняем копию профиля…";
    try {
      var result = await profileRequest(payload);
      if (result.status === 409) {
        identity = profileIdentity(profile.id, true);
        payload.code = identity.code;
        payload.writeKey = identity.writeKey;
        result = await profileRequest(payload);
      }
      if (result.status !== 200 || !result.data.ok) throw new Error();
      output.value = identity.code;
      codeRow.hidden = false;
      status.textContent = "Код готов. На другом устройстве нажмите «Добавить по коду».";
    } catch (error) {
      status.textContent = "Не удалось сохранить копию. Попробуйте ещё раз.";
    } finally {
      button.disabled = false;
    }
  }

  async function copyProfileCode() {
    var input = document.getElementById("profile-share-code");
    var status = document.getElementById("profile-share-status");
    try {
      await window.navigator.clipboard.writeText(input.value);
      status.textContent = "Код скопирован.";
    } catch (error) {
      input.focus();
      input.select();
      status.textContent = "Код выделен. Скопируйте его вручную.";
    }
  }

  async function importProfile(form) {
    var input = document.getElementById("profile-import-code");
    var status = document.getElementById("profile-import-status");
    var button = form.querySelector('button[type="submit"]');
    var code = input.value.toUpperCase().replace(/[\s-]+/g, "");
    if (!codePattern.test(code)) {
      status.textContent = "Введите код из 16 символов.";
      input.focus();
      return;
    }
    button.disabled = true;
    status.textContent = "Загружаем копию профиля…";
    try {
      var result = await profileRequest({ action: "open", code: code });
      if (!form.isConnected) return;
      if (result.status === 404) {
        status.textContent = "Копия профиля по этому коду не найдена.";
        return;
      }
      var profile = result.data.profile;
      if (result.status !== 200 || !profile || profile.version !== 1 || typeof profile.name !== "string" ||
          !profile.name.trim() || profile.name.length > 32 || !profile.records || typeof profile.records !== "object") throw new Error();
      profiles = readProfiles();
      var base = profile.name.trim();
      var name = base;
      for (var number = 2; profiles.some(function (local) { return local.name.toLowerCase() === name.toLowerCase(); }); number += 1) {
        var suffix = " (" + number + ")";
        name = base.slice(0, 32 - suffix.length) + suffix;
      }
      addProfile(name, profile.records);
      document.getElementById("profile-message").textContent = "Копия профиля добавлена.";
    } catch (error) {
      status.textContent = "Не удалось открыть профиль. Попробуйте ещё раз.";
    } finally {
      button.disabled = false;
    }
  }

  function saveRecord(topicId) {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(recordPrefix(activeProfileId) + topicId, JSON.stringify(records[topicId]));
    } catch (error) {
      storageAvailable = false;
    }
  }

  function shuffledBankQuestions(topicId, bank) {
    var pool = shuffle(bank);
    var count = topicTotal(topicId);
    var questions = pool.slice(0, count);
    var previous = records[topicId].attempt;
    if (!previous) return questions;

    if (count < pool.length) {
      var previousIds = previous.steps.map(function (step) { return step.id; });
      if (questions.every(function (question) { return previousIds.indexOf(question.id) !== -1; })) {
        questions[0] = pool[count];
      }
    }
    if (questions.length > 1 && questions[0].id === previous.steps[0].id) {
      questions.push(questions.shift());
    }
    return questions;
  }

  function randomQuestions(topicId) {
    if (topicId === mixed.id) {
      var groups = shuffle(fullSectionTopics.concat(definitionsTopic));
      var perGroup = Math.floor(mixedLength / groups.length);
      var remainder = mixedLength % groups.length;
      return shuffle(groups.reduce(function (all, section, index) {
        return all.concat(shuffle(section.questions).slice(0, perGroup + (index < remainder ? 1 : 0)));
      }, []));
    }
    return shuffledBankQuestions(topicId, topicById[topicId].questions);
  }

  function newAttempt(topicId, reviewIds) {
    var ids = reviewIds ? shuffle(reviewIds) : randomQuestions(topicId).map(function (question) {
      return question.id;
    });
    return {
      review: Boolean(reviewIds),
      complete: false,
      cursor: 0,
      selected: null,
      steps: ids.map(function (id) {
        var order = questionById[id].question.options.map(function (option, index) { return index; });
        return { id: id, order: shuffle(order), answer: null };
      })
    };
  }

  function answeredCount(attempt) {
    return attempt.steps.filter(function (step) { return step.answer !== null; }).length;
  }

  function correctCount(attempt) {
    return attempt.steps.filter(function (step) { return step.answer === 0; }).length;
  }

  function advanceAttempt(record) {
    var attempt = record.attempt;
    if (attempt.cursor + 1 < attempt.steps.length) {
      attempt.cursor += 1;
      return;
    }
    finishAttempt(record);
  }

  function finishAttempt(record) {
    var attempt = record.attempt;
    if (attempt.selected !== null) {
      attempt.steps[attempt.cursor].answer = attempt.selected;
      attempt.selected = null;
    }
    attempt.complete = true;
    var total = attempt.steps.length;
    var correct = correctCount(attempt);
    var messages = correct === total ? mascotMessages.happy : mascotMessages.practice;
    attempt.messageIndex = Math.floor(Math.random() * messages.length);
    if (attempt.review) return;

    var stats = record.stats;
    stats.last = correct;
    stats.lastTotal = total;
    if (!stats.count || correct * stats.bestTotal > stats.best * total) {
      stats.best = correct;
      stats.bestTotal = total;
    }
    stats.count += 1;
  }

  function confirmFinish(attempt) {
    var remaining = attempt.steps.length - answeredCount(attempt) - (attempt.selected === null ? 0 : 1);
    var message = remaining ? "Завершить тест досрочно? Без ответа останется " + questionsLabel(remaining) +
      ". Результат будет рассчитан по всем вопросам теста." : "Показать результат теста?";
    return window.confirm(message);
  }

  function openTest(topicId) {
    var record = records[topicId];
    var attempt = record.attempt;
    var unusedOldDefinitions = topicId === definitionsTopic.id && attempt && !attempt.complete && !attempt.review &&
      attempt.selected === null && !answeredCount(attempt) && questionById[attempt.steps[0].id].replacementId;
    if (!attempt || unusedOldDefinitions) {
      record.attempt = newAttempt(topicId);
      saveRecord(topicId);
    }
    return record.attempt;
  }

  function routeFromHash() {
    var route = window.location.hash.slice(1);
    if (route === "/progress") return { page: "progress" };
    if (route === "/sections") return { page: "sections" };
    if (route === "/medicines") return { page: "modes", topicId: medicineTopic.id };
    var match = /^\/(test|section)\/([a-z-]+)$/.exec(route);
    if (match) {
      var topicId = match[2];
      if (match[1] === "test" && topicById[topicId]) return { page: "test", topicId: topicId };
      if (match[1] === "section" && modesBySection[topicId]) return { page: "modes", topicId: topicId };
    }
    return { page: "home" };
  }

  function testLink(topicId) { return "#/test/" + topicId; }

  function modesLink(sectionId) {
    return sectionId === medicineTopic.id ? "#/medicines" : "#/section/" + sectionId;
  }

  function topicLabel(topic) {
    return topic.modeTitle ? topic.title + " · " + topic.modeTitle : topic.title;
  }

  function topicIcon(topic) {
    return '<span class="tile-icon" aria-hidden="true">' + icon(topic.icon) + '</span>';
  }

  function topicArrow() {
    return '<span class="topic-arrow" aria-hidden="true">' + icon("right", true) + '</span>';
  }

  function backLink(sectionId) {
    var hasModes = Boolean(modesBySection[sectionId]);
    return '<a class="back-link" href="' + (hasModes ? modesLink(sectionId) : '#/sections') + '">' +
      icon("left", true) + (hasModes ? 'К выбору теста' : 'Все разделы') + '</a>';
  }

  function testToolbar(topic) {
    var profile = findProfile(activeProfileId);
    return '<div class="test-toolbar">' + backLink(topic.parentId || topic.id) +
      (profiles.length > 1 ? '<a class="profile-tag" href="#/progress" aria-label="Прогресс профиля ' +
        escapeHtml(profile.name) + '">' + icon("user", true) + '<span>' + escapeHtml(profile.name) + '</span></a>' : '') + '</div>';
  }

  function renderHome() {
    var count = sections.reduce(function (sum, section) { return sum + section.questions.length; },
      medicineTopic.questions.length + definitionsTopic.questions.length);
    var mixedAttempt = records[mixed.id].attempt;
    var mixedInProgress = mixedAttempt && !mixedAttempt.complete;
    var mixedLabel = mixedInProgress ? "Продолжить смешанный тест" : mixed.title;
    var mixedTotal = mixedInProgress ? mixedAttempt.steps.length : topicTotal(mixed.id);
    var asset = heroAsset();
    return '<section class="hero" aria-labelledby="page-title">' +
      '<picture class="hero-picture"><source srcset="' + asset + '.webp" type="image/webp">' +
      '<img src="' + asset + '.jpg" width="1120" height="747" alt="" fetchpriority="high"></picture>' +
      '<div class="hero-copy"><span class="hero-label">' + icon("book", true) + 'Тесты по конспектам</span>' +
      '<h1 id="page-title" tabindex="-1">Фармакология <span>в тестах</span></h1>' +
      '<p>Выберите тему или проверьте себя в смешанном тесте.</p>' +
      '<div class="hero-actions"><a class="button" href="' + testLink(mixed.id) + '">' +
      icon("shuffle", true) + mixedLabel + '</a><span class="hero-count">' + questionsLabel(mixedTotal) + '</span></div></div></section>' +
      '<section class="section-list" id="sections" aria-labelledby="sections-title">' +
      '<div class="section-heading"><h2 id="sections-title" tabindex="-1">Разделы</h2><p>' +
      countLabel(sectionCards.length, "раздел", "раздела", "разделов") + ' · ' + questionsLabel(count) + '</p></div>' +
      '<div class="topic-grid">' + sectionCards.map(function (topic) { return renderTopicCard(topic); }).join("") + '</div></section>';
  }

  function renderTopicCard(topic, modeCard) {
    var attempt = records[topic.id].attempt;
    var chooseMode = !modeCard && modesBySection[topic.id];
    var featured = !modeCard && (topic.id === medicineTopic.id || topic.id === definitionsTopic.id);
    var action = "Начать тест";
    if (chooseMode) {
      action = "Выбрать тест";
    } else if (attempt) {
      action = attempt.complete ? "Посмотреть результат" : "Продолжить тест";
      if (attempt.review && !attempt.complete) action = "Продолжить повторение";
    }
    var href = chooseMode ? modesLink(topic.id) : testLink(topic.id);
    var title = modeCard ? topic.modeTitle : topic.title;
    var description = modeCard && topic.modeDescription ? topic.modeDescription : topic.description;
    var heading = modeCard ? "h2" : "h3";
    return '<a class="topic-card enter theme-' + topic.theme + (featured ? ' is-featured' : '') + '" href="' + href + '" aria-labelledby="topic-' + topic.id + ' count-' + topic.id + ' action-' + topic.id + '">' +
      '<div class="topic-top">' + topicIcon(topic) + '<span class="topic-count" id="count-' + topic.id + '">' + questionsLabel(topicTotal(topic.id)) + '</span></div>' +
      '<div class="topic-copy"><' + heading + ' class="topic-title" id="topic-' + topic.id + '">' + escapeHtml(title) + '</' + heading + '><p>' + escapeHtml(description) + '</p></div>' +
      '<div class="topic-bottom"><span id="action-' + topic.id + '">' + action + '</span>' + topicArrow() + '</div></a>';
  }

  function topicHeading(topic, title, description) {
    return '<div class="page-heading theme-' + topic.theme + '">' + topicIcon(topic) +
      '<div><h1 id="page-title" tabindex="-1">' + escapeHtml(title) + '</h1>' +
      '<p>' + escapeHtml(description) + '</p></div></div>';
  }

  function renderModeMenu(topic) {
    return '<div class="page-narrow">' + backLink() + topicHeading(topic, topic.title, topic.description) +
      '<div class="mode-grid">' + modesBySection[topic.id].map(function (mode) { return renderTopicCard(mode, true); }).join("") + '</div></div>';
  }

  function renderChoice(question, position, optionIndex, selected, answer, reveal) {
    var checked = answer !== null;
    var state = "";
    var marker = "";
    if (reveal && checked && optionIndex === 0) {
      state = " is-correct";
      marker = '<span class="choice-marker">' + icon("check", true) + '<span class="visually-hidden">Правильный ответ</span></span>';
    } else if (reveal && checked && optionIndex === answer) {
      state = " is-wrong";
      marker = '<span class="choice-marker">' + icon("cross", true) + '<span class="visually-hidden">Ваш ответ неверен</span></span>';
    }
    return '<label class="choice' + state + '"><input type="radio" name="answer" value="' + optionIndex + '"' +
      ((checked ? answer : selected) === optionIndex ? " checked" : "") + (checked ? " disabled" : "") + '>' +
      '<span class="choice-body"><span class="choice-letter" aria-hidden="true">' + (letters[position] || position + 1) + '</span>' +
      '<span class="choice-text">' + escapeHtml(question.options[optionIndex]) + '</span>' + marker + '</span></label>';
  }

  function renderFeedback(question, answer) {
    if (answer === null) return "";
    var correct = answer === 0;
    return '<div class="feedback' + (correct ? "" : " is-wrong") + '" id="answer-feedback" tabindex="-1" role="status">' +
      '<strong>' + (correct ? "Верно" : "Ответ неверный") + '</strong>' +
      (correct ? '' : '<p>Правильный ответ - ' + escapeHtml(question.options[0]) + '.</p>') +
      (question.explanation ? '<p>' + escapeHtml(question.explanation) + '</p>' : '') + '</div>';
  }

  function renderTest(topic, attempt) {
    var step = attempt.steps[attempt.cursor];
    var entry = questionById[step.id];
    var question = entry.question;
    var checked = step.answer !== null;
    var delayedFeedback = topic.id === mixed.id;
    var legacyMixed = isLegacyMixedAttempt(topic.id, attempt);
    var total = attempt.steps.length;
    var filled = answeredCount(attempt);
    var prior = checked || delayedFeedback ? Math.max(0, filled - 1) : filled;
    var buttonType = checked ? 'type="button" data-action="next"' : 'type="submit"';
    var disabled = !checked && attempt.selected === null ? " disabled" : "";
    var advances = checked || delayedFeedback;
    var action = advances ? (attempt.cursor + 1 === total ? "Показать результат" : "Дальше") : "Проверить ответ";
    var restartLabel = legacyMixed ? "Начать тест на " + questionsLabel(topicTotal(topic.id)) : "Начать заново";
    var description = topic.modeDescription || topic.description;
    if (topic.id === definitionsTopic.id && entry.replacementId) description = "Подберите определение к каждому термину.";
    if (legacyMixed) description = "Начатая попытка. Ответы после завершения.";
    else if (topic.modeTitle && total < topicTotal(topic.id)) description = "Продолжите начатую попытку.";
    if (attempt.review) description = delayedFeedback ? "Повторение вопросов. Ответы после завершения." : "Повторение вопросов";
    var hint = "Выберите один вариант";
    if (entry.section.id === definitionsTopic.id) {
      hint = entry.replacementId ? "Выберите определение термина" : "Выберите термин по определению";
    }
    if (checked) hint = delayedFeedback ? "Ответ сохранён" : "Ответ проверен";

    return '<div class="page-narrow">' + testToolbar(topic) + topicHeading(topic, topicLabel(topic), description) +
      '<div class="meter-info"><strong>Вопрос ' + (attempt.cursor + 1) + ' из ' + total + '</strong><span>' +
      (delayedFeedback ? "Отвечено " + filled : "Верно " + correctCount(attempt)) + '</span></div>' +
      '<div class="meter" role="progressbar" aria-label="' + (delayedFeedback ? "Сохранённые ответы" : "Проверенные ответы") +
      '" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + filled + '">' +
      '<span style="--fill:' + percent(filled, total) + '%;--prior:' + percent(prior, total) + '%"></span></div>' +
      '<section class="panel' + (checked ? "" : " enter") + '" aria-labelledby="question-title">' +
      (delayedFeedback ? '<span class="question-topic theme-' + entry.section.theme + '">' + escapeHtml(entry.section.title) + '</span>' : '') +
      '<h2 class="question-title" id="question-title" tabindex="-1">' + escapeHtml(question.text) + '</h2>' +
      '<p class="question-hint">' + hint + '</p>' +
      '<form id="question-form"><fieldset class="choices"><legend class="visually-hidden">' + escapeHtml(question.text) + '</legend>' +
      step.order.map(function (optionIndex, position) {
        return renderChoice(question, position, optionIndex, attempt.selected, step.answer, !delayedFeedback);
      }).join("") + '</fieldset>' +
      (delayedFeedback ? '' : renderFeedback(question, step.answer)) +
      '<div class="quiz-actions"><button class="button" ' + buttonType + disabled + '>' + action +
      (advances ? icon("right", true) : '') + '</button></div></form></section>' +
      '<div class="attempt-actions" role="group" aria-label="Управление тестом">' +
      '<button class="button button-secondary" type="button" data-action="restart">' + icon("repeat", true) + restartLabel + '</button>' +
      (filled < total ? '<button class="button button-secondary" type="button" data-action="finish">' + icon("flag", true) + 'Завершить досрочно</button>' : '') +
      '</div></div>';
  }

  function renderMascot(attempt, perfect) {
    var messages = perfect ? mascotMessages.happy : mascotMessages.practice;
    var index = isScore(attempt.messageIndex, messages.length - 1) ? attempt.messageIndex : 0;
    var image = perfect ? "fesco-greeting.png" : "fesco-welcome.png";
    return '<aside class="mascot-note ' + (perfect ? "is-happy" : "is-practice") + '" aria-label="Сообщение Феско">' +
      '<div class="mascot-portrait" aria-hidden="true"><img src="./assets/' + image + '" width="1000" height="1000" alt="" decoding="async"></div>' +
      '<div class="mascot-bubble"><p class="mascot-name">Феско</p><p>' + escapeHtml(messages[index]) + '</p></div></aside>';
  }

  function renderReview(topic, attempt, mistakes, skipped) {
    var showAll = topic.id === mixed.id;
    var entries = showAll ? attempt.steps : mistakes;
    if (!entries.length) return '';
    var canFilter = showAll && mistakes.length > 0 && mistakes.length < entries.length;
    var reviewTitle = showAll ? "Разбор ответов" : (skipped ? "Разбор ошибок и пропусков" : "Разбор ошибок");
    var filterLabel = skipped ? "Ошибки и пропуски" : "Только ошибки";
    return '<section aria-labelledby="review-title"><div class="review-heading">' +
      '<h2 class="review-title" id="review-title">' + reviewTitle + '</h2>' +
      (canFilter ? '<button class="button button-secondary review-toggle" type="button" data-action="filter-mistakes" aria-controls="review-list" aria-pressed="false">' + filterLabel + ' (' + mistakes.length + ')</button>' : '') +
      '</div><div class="review-list" id="review-list">' + entries.map(function (step, index) {
      var entry = questionById[step.id];
      var question = entry.question;
      var correct = step.answer === 0;
      var unanswered = step.answer === null;
      var marker = correct ? "check" : (unanswered ? "minus" : "cross");
      var markerClass = correct ? "right-text" : (unanswered ? "unanswered-text" : "wrong-text");
      var answerLabel = correct ? "Верно" : (unanswered ? "Без ответа" : "Ошибка");
      var answer = unanswered ? '<p class="unanswered-text">Без ответа</p>' : (correct ? '' :
        '<p class="wrong-text"><strong>Ваш ответ</strong> - ' + escapeHtml(question.options[step.answer]) + '</p>');
      return '<details class="review-item" data-correct="' + correct + '"' + (index === 0 ? ' open' : '') + '><summary>' +
        '<span class="review-mark ' + markerClass + '">' + icon(marker, true) +
        '<span class="visually-hidden">' + answerLabel + '</span></span><span>' + escapeHtml(question.text) + '</span></summary>' +
        '<div class="review-copy">' + (showAll ? '<p class="review-topic">' + escapeHtml(entry.section.title) + '</p>' : '') +
        answer +
        '<p class="right-text"><strong>' + (correct ? "Ваш ответ верный" : "Правильный ответ") + '</strong> - ' + escapeHtml(question.options[0]) + '</p>' +
        (question.explanation ? '<p>' + escapeHtml(question.explanation) + '</p>' : '') + '</div></details>';
    }).join("") + '</div></section>';
  }

  function renderResults(topic, attempt) {
    var total = attempt.steps.length;
    var correct = correctCount(attempt);
    var skipped = total - answeredCount(attempt);
    var score = percent(correct, total);
    var mistakes = attempt.steps.filter(function (step) { return step.answer !== 0; });
    var title = skipped ? "Тест завершён досрочно" : (mistakes.length ? "Тест завершён" : "Все ответы верны");
    var retryLabel = skipped ? "Повторить ошибки и пропуски" : "Повторить ошибки";
    var restartLabel = "Пройти ещё раз";
    if (attempt.review) restartLabel = topic.limit ? "Новая случайная подборка" : "Пройти полный тест";

    return '<div class="page-narrow">' + testToolbar(topic) +
      '<section class="result-banner enter" aria-labelledby="page-title"><div class="result-copy">' +
      '<p class="result-topic">' + escapeHtml(topicLabel(topic)) + (attempt.review ? ' · Повторение вопросов' : '') + '</p>' +
      '<h1 class="page-title" id="page-title" tabindex="-1">' + title + '</h1>' +
      '<p>Правильных ответов ' + correct + ' из ' + total + '</p>' +
      (skipped ? '<p>Без ответа ' + skipped + '</p>' : '') + '</div>' +
      '<div class="score" role="img" aria-label="Результат ' + score + ' процентов" style="--fill:' + score + '%"><span>' + score + '%</span></div></section>' +
      renderMascot(attempt, !mistakes.length) +
      '<div class="result-actions">' +
      (mistakes.length ? '<button class="button" type="button" data-action="review">' + icon("repeat", true) + retryLabel + '</button>' : '') +
      '<button class="button' + (mistakes.length ? " button-secondary" : "") + '" type="button" data-action="restart">' +
      restartLabel + '</button>' +
      '<a class="button button-secondary" href="#/progress">Мой прогресс</a></div>' + renderReview(topic, attempt, mistakes, skipped) + '</div>';
  }

  function renderProgressTopic(topic) {
    var record = records[topic.id];
    var total = topicTotal(topic.id);
    var note = "Ещё нет результата · " + questionsLabel(total);
    if (record.stats.count) {
      note = "Лучший результат " + percent(record.stats.best, record.stats.bestTotal) + "% · последний " + percent(record.stats.last, record.stats.lastTotal) + "%";
    }
    if (record.attempt && !record.attempt.complete) {
      var inProgress = "В процессе " + answeredCount(record.attempt) + " из " + record.attempt.steps.length;
      note = record.stats.count ? note + " · " + inProgress : inProgress;
    }
    return '<a class="progress-topic theme-' + topic.theme + '" href="' + testLink(topic.id) + '">' + topicIcon(topic) +
      '<div class="progress-topic-copy"><strong>' + escapeHtml(topicLabel(topic)) + '</strong><span>' + note + '</span></div>' + topicArrow() + '</a>';
  }

  function profileLabel(profile) {
    var initial = Array.from(profile.name)[0].toLocaleUpperCase("ru");
    return '<span class="profile-avatar" aria-hidden="true">' + escapeHtml(initial) + '</span>' +
      '<span class="profile-option-name">' + escapeHtml(profile.name) + '</span>';
  }

  function renderProfilePicker() {
    var options = profiles.map(function (profile) {
      var selected = profile.id === activeProfileId;
      return '<button class="profile-option" type="button" data-action="select-profile" data-profile="' +
        escapeHtml(profile.id) + '" aria-pressed="' + selected + '">' + profileLabel(profile) +
        (selected ? '<span class="profile-option-check">' + icon("check", true) + '</span>' : '') + '</button>';
    });
    return '<details class="profile-picker" id="profile-picker"><summary id="profile-select" aria-describedby="profile-note">' +
      '<span class="visually-hidden">Активный профиль</span>' + profileLabel(findProfile(activeProfileId)) +
      '<span class="profile-chevron">' + icon("down", true) + '</span></summary>' +
      '<div class="profile-menu" aria-label="Профили в браузере">' + options.join("") + '</div></details>';
  }

  function renderProfiles() {
    return '<section class="profile-panel" aria-labelledby="profile-heading">' +
      '<h2 id="profile-heading">Профили на этом устройстве</h2>' +
      '<div class="profile-row">' + renderProfilePicker() +
      '<button class="button button-secondary" type="button" data-action="profile-form" aria-expanded="false" aria-controls="profile-form">Новый профиль</button></div>' +
      '<form class="profile-form" id="profile-form" hidden><label for="profile-name">Имя профиля</label>' +
      '<div class="profile-row"><input id="profile-name" name="profile-name" type="text" maxlength="32" autocomplete="off" required>' +
      '<button class="button" type="submit">Добавить</button></div></form>' +
      '<div class="profile-tools"><button class="button button-secondary" type="button" data-action="share-profile" aria-controls="profile-share">Поделиться кодом</button>' +
      '<button class="button button-secondary" type="button" data-action="profile-import-form" aria-expanded="false" aria-controls="profile-import-form">Добавить по коду</button></div>' +
      '<div class="profile-form" id="profile-share" hidden><p class="profile-note">По коду можно открыть копию текущего прогресса на другом устройстве.</p>' +
      '<div class="profile-row" id="profile-code-row" hidden><input class="profile-code" id="profile-share-code" type="text" aria-label="Код профиля" readonly>' +
      '<button class="button" type="button" data-action="copy-profile-code">Копировать</button></div>' +
      '<p class="profile-message" id="profile-share-status" role="status"></p></div>' +
      '<form class="profile-form" id="profile-import-form" hidden><label for="profile-import-code">Код профиля из 16 символов</label>' +
      '<div class="profile-row"><input class="profile-code" id="profile-import-code" name="profile-code" type="text" maxlength="32" ' +
      'autocomplete="off" autocapitalize="characters" spellcheck="false" required><button class="button" type="submit">Добавить копию</button></div>' +
      '<p class="profile-message" id="profile-import-status" role="status"></p></form>' +
      '<p class="profile-message" id="profile-message" role="status"></p>' +
      '<p class="profile-note" id="profile-note">' + (storageAvailable
        ? "Прогресс сохраняется отдельно для каждого профиля в этом браузере."
        : "Сохранение в браузере недоступно. Прогресс доступен до закрытия страницы.") + '</p></section>';
  }

  function renderProgress() {
    var completedSections = sectionCards.filter(function (topic) {
      return (modesBySection[topic.id] || [topic]).some(function (mode) { return records[mode.id].stats.count > 0; });
    }).length;
    var attempts = topics.reduce(function (sum, topic) { return sum + records[topic.id].stats.count; }, 0);
    return '<div class="page-narrow enter">' + backLink() +
      '<h1 class="page-title" id="page-title" tabindex="-1">Мой прогресс</h1>' + renderProfiles() +
      '<div class="metrics"><div class="metric"><strong>' + completedSections + ' из ' + sectionCards.length + '</strong><span>Разделов пройдено</span></div>' +
      '<div class="metric"><strong>' + attempts + '</strong><span>Завершённых тестов</span></div></div>' +
      '<div class="progress-list">' + topics.map(renderProgressTopic).join("") + '</div></div>';
  }

  function setFocus(id, keepScroll) {
    var element = document.getElementById(id);
    if (!element) return;
    if (keepScroll) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "nearest" });
    } else {
      element.focus();
    }
  }

  function renderPage(focusId, toTop) {
    var route = routeFromHash();
    if (route.page === "test") {
      var topic = topicById[route.topicId];
      var attempt = openTest(topic.id);
      app.innerHTML = attempt.complete ? renderResults(topic, attempt) : renderTest(topic, attempt);
      document.title = topicLabel(topic) + " - ФармТест";
    } else if (route.page === "progress") {
      app.innerHTML = renderProgress();
      document.title = "Мой прогресс - ФармТест";
    } else if (route.page === "modes") {
      var section = topicById[route.topicId];
      app.innerHTML = renderModeMenu(section);
      document.title = section.title + " - ФармТест";
    } else {
      app.innerHTML = renderHome();
      document.title = "ФармТест - фармакология в тестах";
    }
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      var active = link.dataset.nav === route.page ||
        (link.dataset.nav === "sections" && (route.page === "home" || route.page === "modes"));
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (route.page === "sections") {
      document.getElementById("sections").scrollIntoView();
      if (focusId) setFocus("sections-title", true);
    } else {
      if (focusId) setFocus(focusId, !toTop);
      if (toTop) window.scrollTo(0, 0);
    }
  }

  app.addEventListener("change", function (event) {
    var route = routeFromHash();
    if (route.page !== "test" || event.target.name !== "answer") return;
    var attempt = records[route.topicId].attempt;
    var step = attempt.steps[attempt.cursor];
    if (attempt.complete || step.answer !== null) return;
    var selected = Number(event.target.value);
    if (step.order.indexOf(selected) === -1) return;
    attempt.selected = selected;
    saveRecord(route.topicId);
    document.querySelector("#question-form button[type=submit]").disabled = false;
  });

  app.addEventListener("input", function (event) {
    if (event.target.id === "profile-name") event.target.setCustomValidity("");
    if (event.target.id === "profile-import-code") document.getElementById("profile-import-status").textContent = "";
  });

  app.addEventListener("submit", function (event) {
    if (event.target.id === "profile-form") {
      event.preventDefault();
      submitProfile();
      return;
    }
    if (event.target.id === "profile-import-form") {
      event.preventDefault();
      importProfile(event.target);
      return;
    }
    if (event.target.id !== "question-form") return;
    event.preventDefault();
    var route = routeFromHash();
    if (route.page !== "test") return;
    var record = records[route.topicId];
    var attempt = record.attempt;
    var step = attempt.steps[attempt.cursor];
    if (attempt.complete || step.answer !== null || attempt.selected === null) return;
    step.answer = attempt.selected;
    attempt.selected = null;
    var delayedFeedback = route.topicId === mixed.id;
    if (delayedFeedback) advanceAttempt(record);
    saveRecord(route.topicId);
    if (delayedFeedback) {
      renderPage(attempt.complete ? "page-title" : "question-title", true);
    } else {
      renderPage("answer-feedback", false);
    }
  });

  app.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = button.dataset.action;
    if (action === "profile-form" || action === "profile-import-form") {
      var form = document.getElementById(action);
      form.hidden = !form.hidden;
      button.setAttribute("aria-expanded", String(!form.hidden));
      if (!form.hidden) form.querySelector("input").focus();
      return;
    }
    if (action === "select-profile") {
      document.getElementById("profile-picker").open = false;
      if (button.dataset.profile === activeProfileId) setFocus("profile-select", true);
      else selectProfile(button.dataset.profile);
      return;
    }
    if (action === "share-profile") {
      if (!button.disabled) shareProfile(button);
      return;
    }
    if (action === "copy-profile-code") {
      copyProfileCode();
      return;
    }
    var route = routeFromHash();
    if (route.page !== "test") return;
    var record = records[route.topicId];
    var attempt = record.attempt;
    if (action === "filter-mistakes" && attempt.complete) {
      var onlyMistakes = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(onlyMistakes));
      document.querySelectorAll('#review-list [data-correct="true"]').forEach(function (item) {
        item.hidden = onlyMistakes;
      });
      return;
    }
    if (action === "next" && !attempt.complete && attempt.steps[attempt.cursor].answer !== null) {
      advanceAttempt(record);
    } else if (action === "finish" && !attempt.complete) {
      if (!confirmFinish(attempt)) return;
      finishAttempt(record);
    } else if (action === "restart") {
      if (!attempt.complete && (answeredCount(attempt) || attempt.selected !== null) &&
          !window.confirm("Начать тест заново? Ответы в текущей попытке будут сброшены.")) return;
      record.attempt = newAttempt(route.topicId);
    } else if (action === "review" && attempt.complete) {
      var missed = attempt.steps.filter(function (step) { return step.answer !== 0; }).map(function (step) {
        return questionById[step.id].replacementId || step.id;
      });
      if (!missed.length) return;
      record.attempt = newAttempt(route.topicId, missed);
    } else {
      return;
    }
    saveRecord(route.topicId);
    renderPage(record.attempt.complete ? "page-title" : "question-title", true);
  });

  app.addEventListener("keydown", function (event) {
    var picker = event.target.closest(".profile-picker");
    if (!picker) return;
    if (event.key === "Escape" && picker.open) {
      event.preventDefault();
      picker.open = false;
      setFocus("profile-select", true);
      return;
    }
    var key = event.key;
    if (key !== "ArrowDown" && key !== "ArrowUp" && (!picker.open || (key !== "Home" && key !== "End"))) return;
    event.preventDefault();
    picker.open = true;
    var options = Array.from(picker.querySelectorAll(".profile-option"));
    var index = options.indexOf(event.target);
    if (key === "Home") index = 0;
    else if (key === "End") index = options.length - 1;
    else if (index === -1) index = options.indexOf(picker.querySelector('[aria-pressed="true"]'));
    else index = (index + (key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[index].focus();
  });

  window.addEventListener("click", function (event) {
    var picker = document.getElementById("profile-picker");
    if (picker && picker.open && !picker.contains(event.target)) picker.open = false;
  });

  document.querySelector(".skip-link").addEventListener("click", function (event) {
    event.preventDefault();
    setFocus("main-content", false);
  });

  document.querySelector('[data-nav="sections"]').addEventListener("click", function () {
    if (routeFromHash().page === "sections") {
      document.getElementById("sections").scrollIntoView();
      setFocus("sections-title", true);
    }
  });

  themeToggle.addEventListener("click", function () {
    var theme = isDarkTheme() ? "light" : "dark";
    applyTheme(theme);
    try {
      window.localStorage.setItem(themeKey, theme);
    } catch (error) {}
  });

  window.addEventListener("hashchange", function () { renderPage("page-title", true); });

  window.addEventListener("storage", function (event) {
    if (event.key === themeKey) {
      applyTheme(event.newValue === "light" ? "light" : "dark");
      return;
    }
    if (!storageAvailable || !event.key) return;
    if (event.key.indexOf(profilePrefix) === 0) {
      profiles = readProfiles();
      profiles.forEach(function (profile) { profileIdentity(profile.id); });
      if (routeFromHash().page === "progress") renderPage(null, false);
      return;
    }
    var prefix = recordPrefix(activeProfileId);
    if (event.key.indexOf(prefix) !== 0) return;
    var topicId = event.key.slice(prefix.length);
    if (!topicById[topicId]) return;
    records[topicId] = parseRecord(event.newValue, topicId);
    var route = routeFromHash();
    if (route.page !== "test" || route.topicId === topicId) renderPage(null, false);
  });

  applyTheme(isDarkTheme() ? "dark" : "light");
  renderPage(null, false);
})();
