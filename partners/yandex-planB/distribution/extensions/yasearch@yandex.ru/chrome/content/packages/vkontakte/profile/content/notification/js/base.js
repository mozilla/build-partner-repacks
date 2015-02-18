var base = function ($) {
    var extendedEmulator = {
        handler: null,
        data: [
            "{\"name\": \"Александр Пономаренко\", \"status\": false, \"text\": \"Вселенная достаточно огромна, чтобы зоркость наблюдателя гасит эллиптический сарос, как это случилось в 1994 году с кометой Шумейкеpов-Леви 9. Экскадрилья недоступно решает секстант, данное соглашение было заключено на 2-й международной конференции «Земля из космоса - наиболее эффективные решения». Солнечное затмение жизненно вращает вращательный астероид, данное соглашение было заключено на 2-й международной конференции «Земля из космоса - наиболее эффективные решения».\"}",
            "{\"type\": 0, \"name\": \"Александр Пономаренко\", \"icon\": \"i/avatar.png\", \"status\": true, " + "\"text\": \"добрался-таки в сибирь\"}",
            "{\"type\": 1, \"name\": \"Александр Пономаренко\", \"icon\": \"i/avatar.png\", \"status\": true, " + "\"text\": \"Привет Саш, нашел тебя вконтакте. Пошли пиво жрать в пятницу.\"}",
            "{\"type\": 2}",
            "{\"type\": 2, \"name\": \"Александр Пономаренко\", \"group\": \"!!!*Дважды не дающие*!!!\", \"icon\": \"i/avatar2.png\", " + "\"total\": 14500, \"totalFriends\": 15, " + "\"friends\": [" + "{\"icon\": \"i/mem1.png\"}, " + "{\"icon\": \"i/mem2.png\"}, " + "{\"icon\": \"i/mem3.png\"}, " + "{\"icon\": \"i/mem4.png\"}" + "]}"
        ],
        sendData: function () {
            var i = Math.floor(Math.random() * 5);
            if (this.handler) {
                this.handler("data", this.data[i]);
            }
        },
        setExternalHandler: function (f) {
            this.handler = f;
        },
        sendMessage: function (s) {
            if (s === "data_request") {
                this.sendData();
            }
        }
    };
    var base = {
        api: function () {
            var api = null;
            if ($.browser.msie) {
                api = window.external;
            } else if ($.browser.mozilla) {
                api = window.externalInterface;
            }
            if (!api) {
                api = extendedEmulator;
            }
            return api;
        }()
    };
    return base;
}(jQuery);
