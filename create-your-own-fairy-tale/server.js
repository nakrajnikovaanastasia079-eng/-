require("dotenv").config();

const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/story", async (req, res) => {
  const { hero, genre, age, topic } = req.body || {};

  if (!hero || !genre || !age) {
    return res.status(400).json({ error: "Укажите героя, жанр и возраст читателя." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "ИИ пока не подключён. Добавьте OPENAI_API_KEY в переменные окружения сервера. Пока можно использовать демонстрационный режим."
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: "Ты добрый автор оригинальных детских сказок на русском языке. Пиши безопасно и бережно для указанного возраста, без жестокости и пугающих подробностей. Создавай законченный сюжет с добрым финалом. Не копируй известные сказки."
        },
        {
          role: "user",
          content: `Напиши оригинальную сказку на русском языке для возраста ${age}. Главный герой: ${hero}. Жанр: ${genre}. Тема или пожелание: ${topic || "волшебное приключение и важный добрый поступок"}. Длина: примерно 400–600 слов. Придумай короткое название.`
        }
      ]
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Пустой ответ модели");
    res.json({ story: text, mode: "ai" });
  } catch (error) {
    console.error("Story generation failed:", error.message);
    res.status(502).json({
      error: "Не удалось создать сказку через ИИ. Проверьте API-ключ, доступ к API и баланс аккаунта."
    });
  }
});

app.listen(port, () => {
  console.log(`Сказочный генератор запущен: http://localhost:${port}`);
});
