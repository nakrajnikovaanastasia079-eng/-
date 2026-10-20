const form = document.querySelector("#story-form");
const resultCard = document.querySelector("#result-card");
const output = document.querySelector("#story-output");
const title = document.querySelector("#story-title");
const status = document.querySelector("#status");
const submitButton = form.querySelector('button[type="submit"]');

function escapeStoryTitle(text) {
  const firstLine = text.split("\n").find(line => line.trim()) || "Маленькое чудо";
  return firstLine.replace(/^#+\s*/, "").replace(/^\*+|\*+$/g, "").slice(0, 90);
}

function demoStory({ hero, genre, age, topic }) {
  const wish = topic?.trim() || "найти волшебство в обычном дне";
  return `Сказка о ${hero} и маленьком чуде

В одном уютном королевстве, где по утрам на листьях сверкали капельки росы, жил(а) ${hero}. Однажды ${hero} узнал(а) о необычной тайне: где-то рядом спрятано чудо, которое может сделать мир добрее.

«Я отправлюсь на поиски!» — решил(а) герой.

Путь начался у старого сада. Там ${hero} встретил(а) мудрую сову, которая подарила маленький фонарик. «Он светит ярче всего, когда ты помогаешь другим», — объяснила сова.

Дальше дорога привела к ручью, через который не могла перебраться крошечная улитка. ${hero} помог(ла) ей найти безопасную тропинку. И тут фонарик засветился тёплым золотым светом!

Вскоре герой встретил ещё нескольких путешественников и вместе с ними отправился навстречу приключению. Каждый добрый поступок делал фонарик всё ярче, а дорогу — всё удивительнее.

Наконец ${hero} нашёл(ла) то, что искал(а): не сундук с золотом, а волшебное зеркало. В нём отражались все люди и существа, которым герой помог(ла) по пути. Зеркало прошептало: «Настоящее чудо — это доброта, которой ты делишься».

${hero} вернулся(лась) домой с радостью в сердце и понял(а), что даже маленький поступок способен изменить целый мир.

И с тех пор в королевстве стало больше улыбок, друзей и волшебства.

Вот и сказке конец, а доброте — начало! ✨

Жанр: ${genre}. Для читателей: ${age}. Идея: ${wish}.`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  status.classList.remove("error");
  status.textContent = "✨ Готовим волшебную историю…";
  submitButton.disabled = true;
  submitButton.innerHTML = "🪄 Создаём сказку…";

  try {
    const response = await fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось создать сказку.");
    output.textContent = result.story;
    title.textContent = escapeStoryTitle(result.story);
    status.textContent = "Сказка готова!";
  } catch (error) {
    // When the API isn't configured (or the app is opened as a static page),
    // let users try the interface with a clearly labelled demo story.
    output.textContent = demoStory(data);
    title.textContent = `Сказка для ${data.hero}`;
    status.textContent = "Показан демонстрационный пример. Для генерации уникальных сказок подключите сервер и API.";
    if (error.message && !error.message.includes("Failed to fetch")) {
      status.textContent = `Демонстрационный режим: ${error.message}`;
    }
  } finally {
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    submitButton.disabled = false;
    submitButton.innerHTML = "<span>✨</span> Создать сказку <span aria-hidden=\"true\">→</span>";
  }
});

document.querySelector("#copy-btn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    status.textContent = "Текст сказки скопирован.";
  } catch {
    status.textContent = "Не удалось скопировать автоматически. Выделите текст и скопируйте его вручную.";
  }
});

document.querySelector("#new-btn").addEventListener("click", () => {
  resultCard.hidden = true;
  status.textContent = "";
  document.querySelector("#hero").focus();
});

document.querySelector("#save-btn").addEventListener("click", () => {
  const blob = new Blob([`${title.textContent}\n\n${output.textContent}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "moya-skazka.txt";
  link.click();
  URL.revokeObjectURL(url);
  status.textContent = "Сказка скачана в текстовом файле.";
});
