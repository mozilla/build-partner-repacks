'use strict';
const EXPORTED_SYMBOLS = ['notifications'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const GLOBAL = this;
Cu.import('resource://gre/modules/Services.jsm');
const notifications = {
        init: function Notifications_init(application) {
            this._logger = application.getLogger('Notifications');
            this._application = application;
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._createdNotificationsCounter = 0;
            this._groupKeys = Object.create(null);
            this._notifications = [];
            this._showingNotifications = [];
            this._listeners = Object.create(null);
            var originalknockQueue = this._knockQueue;
            this._knockQueue = function () {
            };
            var overrideKnockQueueTimer = new sysutils.Timer(function () {
                    try {
                        Cc['@mozilla.org/appshell/appShellService;1'].getService(Ci.nsIAppShellService).hiddenDOMWindow;
                        if (!animator.hiddenDocument)
                            return;
                        overrideKnockQueueTimer.cancel();
                        this._knockQueue = originalknockQueue;
                        this._knockQueue();
                    } catch (e) {
                    }
                }.bind(this), 5000, true);
        },
        finalize: function Notifications_finalize() {
            this._groupKeys = null;
            this._notifications = null;
            this._showingNotifications = null;
            this._listeners = null;
            this._application = null;
        },
        MAX_UNGROUPED_BY_TYPE: 3,
        MAX_SHOWING_AT_ONCE: 5,
        CLICK_TARGET_OTHER: 1,
        CLICK_TARGET_TITLE: 2,
        CLICK_TARGET_OPTIONS: 3,
        CLICK_TARGET_CLOSE: 4,
        CLOSE_REASON_TIMEOUT: 1,
        CLOSE_REASON_CLOSED_BY_USER: 2,
        TEMPLATE_MESSAGE: 1,
        TEMPLATE_MAIL: 2,
        TEMPLATE_GROUP: 3,
        create: function Notifications_create(componentId, notificationData, replace) {
            var groupKey = null;
            var notificationType = notificationData.type || '';
            if (notificationType) {
                groupKey = componentId + ' :: ' + notificationType;
                delete this._groupKeys[groupKey];
            }
            var notificationId = this._createdNotificationsCounter++;
            var groupedNotifications = [];
            var insertIndex = this._notifications.length;
            if (replace) {
                this._notifications = this._notifications.filter(function (notification, index) {
                    if (notification.groupKey !== groupKey)
                        return true;
                    if (insertIndex > index)
                        insertIndex = index;
                    if (notification.groupedNotifications.length)
                        notification.groupedNotifications.forEach(function (n) groupedNotifications.push(n));
                    else
                        groupedNotifications.push(notification);
                    return false;
                });
            }
            this._notifications.splice(insertIndex, 0, {
                id: notificationId,
                componentId: componentId,
                notificationData: notificationData,
                groupedNotifications: groupedNotifications,
                groupKey: groupKey
            });
            if ('groupSize' in notificationData) {
                let size = notificationData.groupSize;
                if (parseInt(size, 10) !== size || size <= 0)
                    throw new RangeError('Invalid group size (' + size + ')');
            }
            if (groupKey && componentId in this._listeners) {
                let notShownNotifications = this._getNotificationsByType(groupKey).map(function (notification) {
                        if (notification.groupedNotifications.length)
                            return notification.groupedNotifications;
                        return notification;
                    });
                if (notShownNotifications.length > 1) {
                    notShownNotifications = Array.concat.apply(null, notShownNotifications);
                    let groupSize = notShownNotifications.reduce(function (previousValue, {notificationData: notificationData}) {
                            var size = parseInt(notificationData.groupSize || 1, 10);
                            return previousValue + size;
                        }, 0);
                    if (groupSize > this.MAX_UNGROUPED_BY_TYPE) {
                        let queryId = Date.now() + '' + Math.floor(Math.random() * 10000);
                        this._groupKeys[groupKey] = queryId;
                        let notificationsToGroup = notShownNotifications.map(function (n) n.notificationData);
                        this._listeners[componentId].forEach(function (listener) {
                            try {
                                if ('notificationsGroup' in listener)
                                    listener.notificationsGroup(queryId, notificationsToGroup);
                            } catch (e) {
                                this._logger.error(e);
                            }
                        }, this);
                    }
                }
            }
            new sysutils.Timer(this._knockQueue.bind(this), 500);
            return notificationId;
        },
        erase: function Notifications_erase(componentId, onlyHidden) {
            this._notifications = this._notifications.filter(function (notification) {
                if (notification.componentId !== componentId)
                    return true;
                if (notification.groupKey)
                    delete this._groupKeys[notification.groupKey];
                return false;
            }, this);
            if (onlyHidden)
                return;
            var notificationsToClose = this._showingNotifications.filter(function (notification) notification.componentId === componentId);
            animator.closeNotifications(notificationsToClose, this.CLOSE_REASON_TIMEOUT);
            this._closeNotifications(notificationsToClose, this.CLOSE_REASON_TIMEOUT);
        },
        update: function Notifications_update(notificationId, notificationData) {
            var existsNotification;
            var existsNotification = [].concat(this._notifications, this._showingNotifications).filter(function (notification) notification.id === notificationId)[0];
            if (!existsNotification)
                return;
            existsNotification.notificationData = notificationData;
            animator.updateNotifications([existsNotification]);
        },
        group: function Notifications_group(componentId, queryId, notificationData) {
            if (!notificationData.type)
                throw new Error('Notification data without type.');
            if (!queryId)
                throw new Error('Wrong queryId.');
            var key = componentId + ' :: ' + notificationData.type;
            if (this._groupKeys[key] !== queryId)
                return;
            return this.create(componentId, notificationData, true);
        },
        addListener: function NNotifications_addListener(componentId, listener) {
            if (!(componentId in this._listeners))
                this._listeners[componentId] = [];
            if (!this._listeners[componentId].some(function (lstnr) lstnr === listener))
                this._listeners[componentId].push(listener);
        },
        removeListener: function NNotifications_removeListener(componentId, listener) {
            if (!(componentId in this._listeners))
                return;
            this._listeners[componentId] = this._listeners[componentId].filter(function (lstnr) lstnr !== listener);
            if (!this._listeners[componentId].length)
                delete this._listeners[componentId];
        },
        _knockQueue: function Notifications__knockQueue() {
            if (this._isFullScreenMode()) {
                new sysutils.Timer(this._knockQueue.bind(this), 3 * 60000);
                return;
            }
            var available = this.MAX_SHOWING_AT_ONCE - this._showingNotifications.length;
            var notificationsToShow = this._notifications.splice(0, Math.min(this._notifications.length, available));
            if (!notificationsToShow.length)
                return;
            this._showNotifications(notificationsToShow);
        },
        _showNotifications: function Notifications__showNotifications(notificationsToShow) {
            this._showingNotifications = this._showingNotifications.concat(notificationsToShow);
            notificationsToShow.forEach(function (notification) {
                if (notification.groupKey)
                    delete this._groupKeys[notification.groupKey];
            }, this);
            if (sysutils.platformInfo.os.name === 'linux')
                this._closeNotifications(notificationsToShow, this.CLOSE_REASON_TIMEOUT);
            else
                animator.showNotifications(notificationsToShow);
        },
        _closeNotifications: function Notifications__closeNotifications(notificationsToClose, reason) {
            this._showingNotifications = this._showingNotifications.filter(function (notification) notificationsToClose.indexOf(notification) === -1);
            notificationsToClose.forEach(function (notification) {
                var componentId = notification.componentId;
                if (!(componentId in this._listeners))
                    return;
                this._listeners[componentId].forEach(function (listener) {
                    try {
                        if ('notificationClosed' in listener)
                            listener.notificationClosed(notification.id, notification.notificationData, reason);
                    } catch (e) {
                        this._logger.error(e);
                    }
                }, this);
            }, this);
            this._knockQueue();
        },
        _handleClick: function Notifications__handleClick(clickedNotifications, target) {
            target = target || this.CLICK_TARGET_OTHER;
            clickedNotifications.forEach(function (notification) {
                var componentId = notification.componentId;
                if (!(componentId in this._listeners))
                    return;
                this._listeners[componentId].forEach(function (listener) {
                    try {
                        if ('notificationClicked' in listener)
                            listener.notificationClicked(notification.id, notification.notificationData, target);
                    } catch (e) {
                        this._logger.error(e);
                    }
                }, this);
            }, this);
        },
        _getNotificationsByType: function Notifications__getNotificationsByType(groupKey) {
            return this._notifications.filter(function (notification) {
                if (!groupKey || groupKey !== notification.groupKey)
                    return false;
                return true;
            }, this);
        },
        _isFullScreenMode: function Notifications__isFullScreenMode() {
            var topBrowserWindow = Services.wm.getMostRecentWindow('navigator:browser');
            return topBrowserWindow && topBrowserWindow.fullScreen || false;
        },
        _createdNotificationsCounter: 0,
        _groupKeys: null,
        _notifications: null,
        _showingNotifications: null,
        _listeners: null
    };
const animator = {
        showNotifications: function animator_showNotifications(notificationsToShow) {
            notificationsToShow.forEach(function (notification, i) {
                this._showingNotifications.push(notification);
                new sysutils.Timer(function () {
                    this._showNotification(notification);
                }.bind(this), i * 500);
            }, this);
        },
        closeNotifications: function animator_closeNotifications(notificationsToClose, reason) {
            notificationsToClose.forEach(function (notification) this._closeNotification(notification, reason), this);
        },
        updateNotifications: function animator_updateNotifications(notificationsToUpdate) {
            notificationsToUpdate.forEach(function (notification) this._updateNotification(notification), this);
        },
        get hiddenDocument() {
            if (!this._hiddenFrame) {
                const CONTENT_PATH = 'chrome://' + notifications._application.name + '/content/';
                let hiddenFrame = misc.hiddenWindows.getFrame('notifications-frame', CONTENT_PATH + 'overlay/hiddenwindow.xul');
                let hiddenDoc = hiddenFrame.contentDocument;
                let styleElement = hiddenDoc.createElementNS('http://www.w3.org/1999/xhtml', 'style');
                hiddenDoc.documentElement.appendChild(styleElement);
                let stylesheet = styleElement.sheet;
                stylesheet.insertRule('@import url(\'' + CONTENT_PATH + 'dialogs/notifications/notification.css\');', stylesheet.cssRules.length);
                this._hiddenFrame = hiddenFrame;
            }
            return this._hiddenFrame.contentDocument;
        },
        _showNotification: function animator__showNotification(notificationToShow) {
            if (!this._timer) {
                this._timer = new sysutils.Timer(function () {
                    this._showingNotifications.forEach(function (notification) {
                        var panel = notification._panel;
                        if (!panel)
                            return;
                        if (!('move' in panel))
                            return;
                        panel.move();
                    });
                }.bind(this), 10, true);
            }
            var hiddenDoc = this.hiddenDocument;
            var panel = hiddenDoc.createElement('panel');
            panel.setAttribute('noautohide', 'true');
            panel.setAttribute('level', 'top');
            panel.addEventListener('popuphidden', function popuphiddenEventListener(event) {
                panel.removeEventListener('popuphidden', popuphiddenEventListener, false);
                this._closeNotification(notificationToShow, notifications.CLOSE_REASON_TIMEOUT);
            }.bind(this), false);
            panel.yaWinArguments = {
                osName: sysutils.platformInfo.os.name,
                notificationData: notificationToShow.notificationData,
                getMinStartY: function animator_panelHelper_getMinStartY() {
                    return animator._getMinStartYForPanel(panel);
                },
                closePanel: function animator_panelHelper_closePanel() {
                    return animator._closeNotification(notificationToShow, notifications.CLOSE_REASON_CLOSED_BY_USER);
                },
                onClick: function animator_panelHelper_onClick(target) {
                    return animator._onClick(notificationToShow, target);
                },
                CLICK_TARGET_TITLE: notifications.CLICK_TARGET_TITLE,
                CLICK_TARGET_OPTIONS: notifications.CLICK_TARGET_OPTIONS,
                CLICK_TARGET_CLOSE: notifications.CLICK_TARGET_CLOSE,
                CLICK_TARGET_OTHER: notifications.CLICK_TARGET_OTHER
            };
            hiddenDoc.documentElement.appendChild(panel);
            notificationToShow._panel = panel;
        },
        _closeNotification: function animator__closeNotification(notification, reason) {
            var notificationIndex = this._showingNotifications.indexOf(notification);
            if (notificationIndex !== -1) {
                this._showingNotifications.splice(notificationIndex, 1);
                notifications._closeNotifications([notification], reason);
            }
            if (notification._panel) {
                if ('close' in notification._panel)
                    notification._panel.close();
                delete notification._panel;
            }
            if (this._timer && !this._showingNotifications.length) {
                this._timer.cancel();
                this._timer = null;
            }
        },
        _onClick: function animator__onClick(notification, target) {
            notifications._handleClick([notification], target);
        },
        _updateNotification: function animator__updateNotification(notificationToUpdate) {
            var panel = notificationToUpdate._panel;
            if (!panel || !panel.yaWinArguments)
                return;
            panel.yaWinArguments.notificationData = notificationToUpdate.notificationData;
            panel.updateData();
        },
        _getMinStartYForPanel: function animator__getMinStartYForPanel(panelElement) {
            var y = 0;
            var i = this._showingNotifications.length;
            while (i--) {
                let panel = this._showingNotifications[i]._panel;
                if (!panel)
                    continue;
                if (panel === panelElement)
                    break;
                y += Math.min(panel.stage + 0.1, 1) * panel.boxObject.height + panel.heightMargin;
            }
            return y;
        },
        _hiddenFrame: null,
        _showingNotifications: [],
        _timer: null
    };
