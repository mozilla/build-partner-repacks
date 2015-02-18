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
    prefixFromNow: "через",
    suffixAgo: "тому",
    suffixFromNow: null,
    seconds: "менше хвилини",
    minute: "хвилину",
    hour: "годину",
    day: "день",
    month: "місяць",
    year: "рік",
    minutes: function (value) {
        return Y.l8n.numpf(value, "%d хвилину", "%d хвилини", "%d хвилин");
    },
    hours: function (value) {
        return Y.l8n.numpf(value, "%d годину", "%d години", "%d годин");
    },
    days: function (value) {
        return Y.l8n.numpf(value, "%d день", "%d дні", "%d днів");
    },
    months: function (value) {
        return Y.l8n.numpf(value, "%d місяць", "%d місяці", "%d місяців");
    },
    years: function (value) {
        return Y.l8n.numpf(value, "%d рік", "%d роки", "%d років");
    },
    numbers: []
};
Y.l8n.dayMonthTemplate = [
    "%d Cічня",
    "%d Лютого",
    "%d Березня",
    "%d Квітня",
    "%d Травня",
    "%d Червня",
    "%d Липня",
    "%d Серпня",
    "%d Вересня",
    "%d Жовтня",
    "%d Листопада",
    "%d Грудня"
];
