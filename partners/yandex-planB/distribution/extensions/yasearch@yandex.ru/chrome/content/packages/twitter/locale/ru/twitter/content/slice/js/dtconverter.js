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
    suffixAgo: "назад",
    suffixFromNow: null,
    seconds: "меньше минуты",
    minute: "минуту",
    hour: "час",
    day: "день",
    month: "месяц",
    year: "год",
    minutes: function (value) {
        return Y.l8n.numpf(value, "%d минута", "%d минуты", "%d минут");
    },
    hours: function (value) {
        return Y.l8n.numpf(value, "%d час", "%d часа", "%d часов");
    },
    days: function (value) {
        return Y.l8n.numpf(value, "%d день", "%d дня", "%d дней");
    },
    months: function (value) {
        return Y.l8n.numpf(value, "%d месяц", "%d месяца", "%d месяцев");
    },
    years: function (value) {
        return Y.l8n.numpf(value, "%d год", "%d года", "%d лет");
    },
    numbers: []
};
Y.l8n.dayMonthTemplate = [
    "%d января",
    "%d февраля",
    "%d марта",
    "%d апреля",
    "%d мая",
    "%d июня",
    "%d июля",
    "%d августа",
    "%d сентября",
    "%d октября",
    "%d ноября",
    "%d декабря"
];
