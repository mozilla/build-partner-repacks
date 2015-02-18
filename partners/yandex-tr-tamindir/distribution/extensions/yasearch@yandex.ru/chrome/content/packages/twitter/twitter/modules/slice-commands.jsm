var EXPORTED_SYMBOLS = ["module"];
function module(app, common) {
    app.sliceCommands = {
        "slice:load": function (data, topic) {
            this.log("receive \"slice:load\"");
            var data = {
                uid: this.twitterAccount.credentials.uid,
                dtd: app.entities.source,
                overlayTemplate: common.utils.readFile("content/slice/transform/overlay.jsont"),
                messagesTemplate: common.utils.readFile("content/slice/transform/messages.jsont")
            };
            this.notifySlice({
                message: "user:info",
                data: data
            });
        },
        "twitter:fresh": function (data) {
            this.hasNewDataItems = data;
            common.observerService.notify("display");
        },
        "twitter:logout": function () {
            this.twitterAccount.disconnect();
        },
        "api:request": function (data) {
            var postDataObject = null;
            if (data.params.length) {
                postDataObject = {};
                for (var i = 0; i < data.params.length; ++i) {
                    var p = data.params[i];
                    postDataObject[p.name] = p.value;
                }
            }
            var timer;
            function readystateListener(event) {
                var target = event.target;
                if (timer && target.readyState >= 3) {
                    timer.cancel();
                    timer = null;
                }
                if (target.readyState === 4) {
                    var response = "";
                    var status = target.status;
                    if (status >= 200 && status < 500) {
                        response = target.responseText;
                    }
                    app.notifySlice({
                        message: "api:response",
                        data: {
                            id: data.id,
                            status: status,
                            responseText: response
                        }
                    });
                }
            }
            var asyncWatcher = this.twitterAccount.sendSignedRequest(data.method, data.url, readystateListener, postDataObject, 3);
        }
    };
}
