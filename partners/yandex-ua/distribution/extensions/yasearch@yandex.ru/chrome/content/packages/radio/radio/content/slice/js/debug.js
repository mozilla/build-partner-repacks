window.YBRadio = window.YBRadio || {};
YBRadio.debug = function () {
    var STR = {
        "dialog.settings.row-name": "Наз вание",
        "dialog.settings.row-url": "Адр ес",
        "dialog.settings.button-add": "Добавить",
        "dialog.settings.button-change": "Изменить",
        "dialog.settings.button-delete": "Удалить",
        "dialog.settings.button-play": "Играть",
        "dialog.settings.button-stop": "Остановить",
        "dialog.settings.button-close": "Закрыть",
        "dialog.delstation.question": "Вы уверены, что хотите удалить выбранную радиостанцию?",
        "dialog.yes": "Да",
        "dialog.no": "Нет",
        "dialog.ok": "Ok",
        "dialog.cancel": "Отмена",
        "dialog.changestation.alert": "Проиграть радиостанцию после ее изменения",
        "dialog.addstation.notice": "Кнопка «Радио» работает корректно только с mp3 потоками и плейлистами, содержащими mp3 потоки",
        "dialog.delstattion.title": "delete station",
        "dialog.changestation.title": "change station",
        "dialog.addstation.title": "add station"
    };
    return {
        init: function () {
            if (window.widgetAdapter) {
                return;
            }
            var cbacks = null;
            window.widgetAdapter = {
                getLocalizedString: function (key) {
                    return STR[key] || key;
                },
                startCommand: "add",
                newName: function () {
                    return "debug new name";
                },
                getAll: function () {
                    return [
                        {
                            id: "1",
                            name: "radio1",
                            url: "http://url 1"
                        },
                        {
                            id: "2",
                            name: "radio2",
                            url: "http://url 2"
                        },
                        {
                            id: "3",
                            name: "radio3",
                            url: "http://url 3"
                        },
                        {
                            id: "4",
                            name: "radio4",
                            url: "http://url 4"
                        },
                        {
                            id: "5",
                            name: "radio5",
                            url: "http://url 5",
                            current: true
                        },
                        {
                            id: "6",
                            name: "radio6",
                            url: "http://url 6"
                        },
                        {
                            id: "7",
                            name: "radio7",
                            url: "http://url 7"
                        }
                    ];
                },
                on: function (handlers) {
                    cbacks = handlers;
                },
                __cmdToSlice: function (t, d) {
                    cbacks[t](d, t);
                }
            };
        }
    };
}();
