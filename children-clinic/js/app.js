"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const body = document.body;
  const appointmentModal = $("#appointmentModal");
  const appointmentForm = $("#appointmentForm");
  const appointmentSuccess = $("#appointmentSuccess");
  const appointmentTitle = $("#appointmentTitle");
  const appointmentSubtitle = $("#appointmentSubtitle");
  const appointmentMode = $("#appointmentMode");
  const visitType = $("#visitType");
  const nameInput = $("#clientName");
  const phoneInput = $("#clientPhone");
  const dateInput = $("#clientDate");
  const consentInput = $("#clientConsent");
  const successText = $("#appointmentSuccessText");
  const submitButton = $(".form__submit", appointmentForm);

  const chatWidget = $("#chatWidget");
  const chatBody = $("#chatMessages");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const chatQuick = $(".chat__quick");

  const mobileMenu = $("#mobileMenu");
  const menuToggle = $("#menuToggle");
  const mobileAboutToggle = $(".mobile-menu__toggle");
  const mobileAbout = $("#mobileAbout");

  const aboutMenuItem = $("#aboutMenuItem");
  const aboutToggle = $(".nav__toggle", aboutMenuItem);

  const searchModal = $("#searchModal");
  const searchInput = $("#searchInput");
  const searchForm = $("#searchForm");
  const searchResult = $("#searchResult");
  const searchHints = $("#searchHints");

  const toast = $("#toast");

  let lastFocused = null;
  let toastTimer = null;
  let chatReplyTimer = null;
  let appointmentResetTimer = null;

  /* ------------------------------------------------------------------------
     Блокировка прокрутки
     ------------------------------------------------------------------------ */

  const syncBodyLock = () => {
    const locked =
      appointmentModal.classList.contains("is-open") ||
      searchModal.classList.contains("is-open") ||
      mobileMenu.classList.contains("is-open");
    body.classList.toggle("is-locked", locked);
  };

  /* ------------------------------------------------------------------------
     Тост
     ------------------------------------------------------------------------ */

  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  };

  /* ------------------------------------------------------------------------
     Модальное окно записи
     ------------------------------------------------------------------------ */

  const setMinDate = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    dateInput.min = local.toISOString().slice(0, 10);
  };

  const resetAppointmentForm = () => {
    appointmentForm.reset();
    visitType.value = "online";
    appointmentForm.hidden = false;
    appointmentSuccess.hidden = true;
    submitButton.disabled = false;
    $("span", submitButton).textContent = "Отправить заявку";
    $$(".field.is-invalid", appointmentForm).forEach((field) => field.classList.remove("is-invalid"));
    $(".field__error--consent").classList.remove("is-visible");
  };

  const openAppointment = (mode = "online", trigger = null) => {
    window.clearTimeout(appointmentResetTimer);
    lastFocused = trigger || document.activeElement;
    resetAppointmentForm();

    if (mode === "home") {
      visitType.value = "home";
      appointmentMode.textContent = "Вызов на дом";
      appointmentTitle.textContent = "Вызвать врача на дом";
      appointmentSubtitle.textContent = "Оставьте контакты — администратор уточнит адрес и подберёт удобное время для визита педиатра.";
    } else {
      visitType.value = "online";
      appointmentMode.textContent = "Онлайн-запись";
      appointmentTitle.textContent = "Записаться на приём";
      appointmentSubtitle.textContent = "Оставьте контакты — администратор свяжется с вами и подтвердит запись.";
    }

    setMinDate();
    appointmentModal.classList.add("is-open");
    appointmentModal.setAttribute("aria-hidden", "false");
    syncBodyLock();

    window.setTimeout(() => nameInput.focus(), 240);
  };

  const closeAppointment = () => {
    appointmentModal.classList.remove("is-open");
    appointmentModal.setAttribute("aria-hidden", "true");
    syncBodyLock();
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
    appointmentResetTimer = window.setTimeout(resetAppointmentForm, 260);
  };

  const markInvalid = (input) => {
    const field = input.closest(".field");
    if (field) field.classList.add("is-invalid");
  };

  const clearInvalid = (input) => {
    const field = input.closest(".field");
    if (field) field.classList.remove("is-invalid");
  };

  const isPhoneValid = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
    return digits.length === 11 && digits.startsWith("7");
  };

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11);

    const rest = digits.slice(1);
    let result = "+7";
    if (rest.length) result += ` (${rest.slice(0, 3)}`;
    if (rest.length >= 3) result += ") " + rest.slice(3, 6);
    if (rest.length >= 6) result += "-" + rest.slice(6, 8);
    if (rest.length >= 8) result += "-" + rest.slice(8, 10);
    return result;
  };

  phoneInput.addEventListener("input", () => {
    const cursorAtEnd = phoneInput.selectionStart === phoneInput.value.length;
    const formatted = formatPhone(phoneInput.value);
    if (phoneInput.value !== formatted) {
      phoneInput.value = formatted;
      if (cursorAtEnd) phoneInput.setSelectionRange(formatted.length, formatted.length);
    }
    clearInvalid(phoneInput);
  });

  [nameInput, dateInput].forEach((input) => {
    input.addEventListener("input", () => clearInvalid(input));
  });
  consentInput.addEventListener("change", () => {
    $(".field__error--consent").classList.toggle("is-visible", !consentInput.checked);
  });

  appointmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    $$(".field.is-invalid", appointmentForm).forEach((field) => field.classList.remove("is-invalid"));
    $(".field__error--consent").classList.remove("is-visible");

    let firstInvalid = null;
    if (nameInput.value.trim().length < 2) {
      markInvalid(nameInput);
      firstInvalid = firstInvalid || nameInput;
    }
    if (!isPhoneValid(phoneInput.value)) {
      markInvalid(phoneInput);
      firstInvalid = firstInvalid || phoneInput;
    }
    if (!consentInput.checked) {
      $(".field__error--consent").classList.add("is-visible");
      firstInvalid = firstInvalid || consentInput;
    }

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: false });
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value;
    const specialist = $("#clientSpecialist").value;
    const mode = visitType.value;

    submitButton.disabled = true;
    $("span", submitButton).textContent = "Отправляем…";

    window.setTimeout(() => {
      submitButton.disabled = false;
      $("span", submitButton).textContent = "Отправить заявку";
      appointmentForm.hidden = true;
      appointmentSuccess.hidden = false;

      const what = specialist ? ` к специалисту «${specialist}»` : "";
      const format = mode === "home" ? "Врач приедет на дом" : "Мы ждём вас в клинике";
      successText.textContent =
        `${name}, спасибо! Заявка${what} принята. ${format}. Администратор позвонит на номер ${phone} в течение 15 минут в рабочие часы.`;
      $(".form-success .btn", appointmentSuccess).focus({ preventScroll: true });
    }, 700);
  });

  $$("[data-appointment]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      closeMobileMenu();
      openAppointment(button.dataset.appointment === "home" ? "home" : "online", button);
    });
  });

  $$("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeAppointment);
  });

  /* ------------------------------------------------------------------------
     Чат
     ------------------------------------------------------------------------ */

  const scrollChatToBottom = () => {
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  const nowTime = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const addChatMessage = (text, type = "in") => {
    const message = document.createElement("div");
    message.className = `message message--${type}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    const time = document.createElement("time");
    time.textContent = nowTime();
    message.append(paragraph, time);
    chatBody.appendChild(message);
    scrollChatToBottom();
    return message;
  };

  const addTyping = () => {
    const typing = document.createElement("div");
    typing.className = "message message--in message--typing";
    typing.setAttribute("aria-label", "Администратор печатает");
    typing.innerHTML = "<i></i><i></i><i></i>";
    chatBody.appendChild(typing);
    scrollChatToBottom();
    return typing;
  };

  const botReply = (text, delay = 900) => {
    window.clearTimeout(chatReplyTimer);
    $$(".message--typing", chatBody).forEach((element) => element.remove());
    const typing = addTyping();
    chatReplyTimer = window.setTimeout(() => {
      typing.remove();
      addChatMessage(text, "in");
    }, delay);
  };

  const openChat = () => {
    if (chatWidget.classList.contains("is-open")) {
      chatInput.focus();
      return;
    }
    closeMobileMenu();
    chatWidget.classList.add("is-open");
    chatWidget.setAttribute("aria-hidden", "false");
    window.setTimeout(() => chatInput.focus(), 250);
  };

  const closeChat = () => {
    chatWidget.classList.remove("is-open");
    chatWidget.setAttribute("aria-hidden", "true");
  };

  const quickReplies = {
    "Записаться к педиатру":
      "Конечно! Нажмите кнопку «Записаться онлайн» в шапке сайта — я помогу подобрать педиатра и удобное время. Или оставьте номер телефона здесь, и администратор перезвонит.",
    "Уточнить цены":
      "Приём педиатра — от 2 500 ₽, УЗИ — от 1 900 ₽, анализы — от 490 ₽. Точную стоимость администратор подтвердит после записи. Что вас интересует?",
    "Вызвать врача на дом":
      "Педиатр приезжает на дом в день обращения. Нажмите «Вызвать врача на дом» на сайте или напишите здесь адрес и возраст ребёнка — передам администратору.",
    "Работаете по ДМС?":
      "Да, мы работаем с большинством страховых компаний. Напишите название вашей страховой — проверим программу и подскажем, какие услуги доступны."
  };

  $$("[data-chat-quick]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.dataset.chatQuick;
      addChatMessage(text, "out");
      if (chatQuick) chatQuick.remove();
      botReply(quickReplies[text] || "Передала вопрос администратору. Ответим в течение пары минут.", 850);
    });
  });

  const getBotAnswer = (message) => {
    const text = message.toLowerCase();
    if (/(цена|стоим|сколько|прайс)/.test(text)) return quickReplies["Уточнить цены"];
    if (/(дом|адрес|выезд)/.test(text)) return quickReplies["Вызвать врача на дом"];
    if (/(дмс|страхов)/.test(text)) return quickReplies["Работаете по ДМС?"];
    if (/(запис|приём|прием|талоне|время)/.test(text)) return quickReplies["Записаться к педиатру"];
    if (/(телефон|позвон|номер)/.test(text)) return "Наш телефон: 8 (992) 514-14-65. Работаем пн–сб с 8:00 до 20:00, вс с 9:00 до 18:00. Можете также нажать «Записаться онлайн» — перезвоним сами.";
    return "Спасибо! Передала сообщение администратору. Ответим здесь в течение 2–3 минут. Если вопрос срочный, позвоните нам: 8 (992) 514-14-65.";
  };

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) {
      chatInput.focus();
      return;
    }
    addChatMessage(message, "out");
    chatInput.value = "";
    if (chatQuick) chatQuick.remove();
    botReply(getBotAnswer(message), 1100);
  });

  $$(".js-chat").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openChat();
    });
  });

  $("#chatClose").addEventListener("click", closeChat);

  /* ------------------------------------------------------------------------
     Выпадающее меню «О центре»
     ------------------------------------------------------------------------ */

  const setAboutOpen = (open) => {
    aboutMenuItem.classList.toggle("is-open", open);
    aboutToggle.setAttribute("aria-expanded", String(open));
  };

  aboutToggle.addEventListener("click", () => {
    setAboutOpen(!aboutMenuItem.classList.contains("is-open"));
  });

  aboutMenuItem.addEventListener("mouseenter", () => aboutToggle.setAttribute("aria-expanded", "true"));
  aboutMenuItem.addEventListener("mouseleave", () => {
    if (!aboutMenuItem.contains(document.activeElement)) {
      setAboutOpen(false);
    }
  });

  aboutMenuItem.addEventListener("focusout", (event) => {
    if (!aboutMenuItem.contains(event.relatedTarget)) {
      setAboutOpen(false);
    }
  });

  aboutToggle.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAboutOpen(true);
      const first = $(".dropdown__item", aboutMenuItem);
      if (first) first.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && aboutMenuItem.classList.contains("is-open")) {
      setAboutOpen(false);
      aboutToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!aboutMenuItem.contains(event.target)) setAboutOpen(false);
  });

  /* ------------------------------------------------------------------------
     Мобильное меню
     ------------------------------------------------------------------------ */

  function closeMobileMenu() {
    if (!mobileMenu.classList.contains("is-open")) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    $(".menu-toggle__label").textContent = "Меню";
    syncBodyLock();
  }

  menuToggle.addEventListener("click", () => {
    const willOpen = !mobileMenu.classList.contains("is-open");
    mobileMenu.classList.toggle("is-open", willOpen);
    mobileMenu.setAttribute("aria-hidden", String(!willOpen));
    menuToggle.classList.toggle("is-open", willOpen);
    menuToggle.setAttribute("aria-expanded", String(willOpen));
    menuToggle.setAttribute("aria-label", willOpen ? "Закрыть меню" : "Открыть меню");
    $(".menu-toggle__label").textContent = willOpen ? "Закрыть" : "Меню";
    syncBodyLock();
  });

  mobileAboutToggle.addEventListener("click", () => {
    const open = mobileAboutToggle.getAttribute("aria-expanded") === "true";
    mobileAboutToggle.setAttribute("aria-expanded", String(!open));
    mobileAbout.hidden = open;
  });

  $$("a", mobileMenu).forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(closeMobileMenu, 40);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) closeMobileMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMenu.classList.contains("is-open") &&
      !mobileMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });

  /* ------------------------------------------------------------------------
     Поиск
     ------------------------------------------------------------------------ */

  const openSearch = () => {
    lastFocused = document.activeElement;
    closeMobileMenu();
    searchModal.classList.add("is-open");
    searchModal.setAttribute("aria-hidden", "false");
    syncBodyLock();
    window.setTimeout(() => searchInput.focus(), 200);
  };

  const closeSearch = () => {
    searchModal.classList.remove("is-open");
    searchModal.setAttribute("aria-hidden", "true");
    searchResult.hidden = true;
    searchHints.hidden = false;
    searchForm.reset();
    syncBodyLock();
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
  };

  $("#searchOpen").addEventListener("click", openSearch);
  $$("[data-close-search]").forEach((button) => button.addEventListener("click", closeSearch));

  $$("[data-search-go]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = $(button.dataset.searchGo);
      closeSearch();
      if (target) window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    });
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) {
      searchInput.focus();
      return;
    }
    searchHints.hidden = true;
    searchResult.hidden = false;
    searchResult.innerHTML = "";
    const text = document.createElement("p");
    const strong = document.createElement("b");
    strong.textContent = `«${query}»`;
    text.append("По запросу ", strong, " ничего не найдено на этой странице. Попробуйте выбрать раздел или задайте вопрос администратору — подскажем врача и время.");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--primary btn--sm js-chat";
    button.textContent = "Спросить в чате";
    button.addEventListener("click", () => {
      closeSearch();
      window.setTimeout(openChat, 120);
    });
    searchResult.append(text, button);
  });

  /* ------------------------------------------------------------------------
     Ссылки-заглушки
     ------------------------------------------------------------------------ */

  $$("[data-stub]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast(link.dataset.stub || "Этот раздел скоро появится");
      if (aboutMenuItem.contains(link)) setAboutOpen(false);
    });
  });

  /* ------------------------------------------------------------------------
     Клавиатура и закрытие
     ------------------------------------------------------------------------ */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (searchModal.classList.contains("is-open")) {
        closeSearch();
        return;
      }
      if (appointmentModal.classList.contains("is-open")) {
        closeAppointment();
        return;
      }
      if (chatWidget.classList.contains("is-open")) {
        closeChat();
        return;
      }
      if (mobileMenu.classList.contains("is-open")) {
        closeMobileMenu();
        menuToggle.focus();
      }
    }

    if (event.key === "Tab") {
      const openDialog = appointmentModal.classList.contains("is-open")
        ? appointmentModal
        : searchModal.classList.contains("is-open")
          ? searchModal
          : null;
      if (!openDialog) return;

      const focusable = $$(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        openDialog
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  /* ------------------------------------------------------------------------
     Стартовые значения
     ------------------------------------------------------------------------ */

  setMinDate();
})();
