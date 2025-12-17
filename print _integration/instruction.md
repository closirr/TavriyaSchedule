# Інтеграція модуля друку розкладу

## Швидкий старт

### 1. Підключення
```html
<script src="schedule-print.js"></script>
```

### 2. Використання
```javascript
const printer = new SchedulePrinter();
printer.print(scheduleData);
```

---

## Формат даних

```javascript
const scheduleData = {
  semester: "1 півріччя 2025–2026 н.р.",
  directorName: "Маргарита РОМАНОВА",
  groups: ["Км-11", "МЕТЕл-11", "ЕкА-11", "МТ-11"],
  schedule: {
    "ПОНЕДІЛОК": [
      {
        number: 1,
        time: "9.00–10.20",
        groups: {
          "Км-11": { subject: "Математика", teacher: "Іванов І.І." },
          "МЕТЕл-11": { subject: "Фізика", teacher: "Петров П.П." },
          // ...інші групи
        }
      },
      // ...інші пари
    ],
    "ВІВТОРОК": [...],
    // ...інші дні
  }
};
```

---

## Конфігурація

```javascript
const printer = new SchedulePrinter({
  groupsPerPage: 4,           // Груп на сторінці (за замовчуванням 4)
  excludeDays: ['СУБОТА'],    // Виключити дні
  days: ['ПОНЕДІЛОК', 'ВІВТОРОК', 'СЕРЕДА', 'ЧЕТВЕР', "П'ЯТНИЦЯ", 'СУБОТА']
});
```

---

## Методи

| Метод | Опис |
|-------|------|
| `print(data)` | Відкриває вікно друку |
| `generateHTML(data)` | Повертає HTML рядок |

---

## Важливі нюанси

1. **Пагінація А4**: Кожен день НЕ розривається на дві сторінки (`page-break-inside: avoid`)
2. **Групи по 4**: При >4 групах — автоматична розбивка на секції
3. **Портретна орієнтація**: A4 portrait
4. **Розділювач**: Пунктирна лінія між секціями груп

---

## Приклад повної інтеграції

```html
<!DOCTYPE html>
<html>
<head>
  <script src="schedule-print.js"></script>
</head>
<body>
  <button onclick="printSchedule()">Друк</button>
  
  <script>
    function printSchedule() {
      const data = fetchScheduleFromYourAPI(); // Ваш метод отримання даних
      const printer = new SchedulePrinter({ groupsPerPage: 4 });
      printer.print(data);
    }
  </script>
</body>
</html>
```
