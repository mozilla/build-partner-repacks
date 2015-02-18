Y.l8n.datetimeEntities = {
    prefixAgo: null,
    prefixFromNow: null,
    suffixAgo: "бұрын",
    suffixFromNow: "кейін",
    seconds: "бір минуттан аз",
    minute: "минут",
    hour: "сағат",
    day: "күн",
    month: "ай",
    year: "жыл",
    minutes: function (value, d, fromNow) {
        return "%d минут" + (fromNow ? "тан" : "");
    },
    hours: function (value, d, fromNow) {
        return "%d сағат" + (fromNow ? "тан" : "");
    },
    days: function (value, d, fromNow) {
        return "%d күн" + (fromNow ? "нен" : "");
    },
    months: function (value, d, fromNow) {
        return "%d ай" + (fromNow ? "дан" : "");
    },
    years: function (value, d, fromNow) {
        return "%d жыл" + (fromNow ? "дан" : "");
    },
    numbers: []
};
Y.l8n.dayMonthTemplate = [
    "%d Қаңтардың",
    "%d Ақпанның",
    "%d Науырыздың",
    "%d Сәуірдің",
    "%d Мамырдың",
    "%d Маусымның",
    "%d Шілденің",
    "%d Тамыздың",
    "%d Қыркүйектің",
    "%d Қазанның",
    "%d Қарашаның",
    "%d Желтоқсанның"
];
