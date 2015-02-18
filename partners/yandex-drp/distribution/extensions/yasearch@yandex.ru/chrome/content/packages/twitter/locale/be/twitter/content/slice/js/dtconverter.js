Y.l8n.numpf = function (n, f, s, t) {
    var n10 = n % 10;
    if (n10 == 1 && (n == 1 || n > 20)) {
        return f;
    } else if (n10 > 1 && n10 < 5 && (n > 20 || n < 10)) {
        return s;
    } else {
        return t;
    }
};
Y.l8n.datetimeEntities = {
    prefixAgo: null,
    prefixFromNow: "праз",
    suffixAgo: "таму",
    suffixFromNow: null,
    seconds: "менш за хвіліну",
    minute: "хвіліну",
    hour: "гадзіну",
    day: "дзень",
    month: "месяц",
    year: "год",
    minutes: function (value) {
        return Y.l8n.numpf(value, "%d хвіліну", "%d хвіліны", "%d хвілін");
    },
    hours: function (value) {
        return Y.l8n.numpf(value, "%d гадзіну", "%d гадзіны", "%d гадзін");
    },
    days: function (value) {
        return Y.l8n.numpf(value, "%d дзень", "%d дні", "%d дзён");
    },
    months: function (value) {
        return Y.l8n.numpf(value, "%d месяц", "%d месяцы", "%d месяцаў");
    },
    years: function (value) {
        return Y.l8n.numpf(value, "%d год", "%d гады", "%d гадоў");
    },
    numbers: []
};
Y.l8n.dayMonthTemplate = [
    "%d Студзеня",
    "%d Лютага",
    "%d Сакавіка",
    "%d Красавіка",
    "%d Траўня",
    "%d Чэрвеня",
    "%d Ліпеня",
    "%d Жніўня",
    "%d Верасня",
    "%d Кастрычніка",
    "%d Лістапада",
    "%d Снежня"
];
