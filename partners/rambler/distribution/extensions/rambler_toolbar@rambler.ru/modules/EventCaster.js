/**
 * @author Max L Dolgov bananafishbone at gmail dot com
 * @description Custom Events Manager for event-driven (unobtrusive) interactiion
**/
let EXPORTED_SYMBOLS = ["EventCaster"];

var EventCaster = {
    _evtMap : {},
    _evtNfo : {},

    subscribe : function( topic, fn, ctx ) {
        if ( !(topic in this._evtMap)) {
            this._evtMap[ topic ] = [];
            this._evtNfo[ topic ] = { removed: 0 };
        } 
        var list = this._evtMap[ topic ], nfo = this._evtNfo[ topic ];
        var listener = { 
            id     : list.length + nfo.removed, 
            fn     : fn,
            ctx    : (('undefined' == typeof ctx || !ctx)? '' : ctx)
        };
        this._evtMap[ topic ].push( listener );
        
        return ('' + topic +'#' + listener.id);
    },
    
    unsubscribe : function( handle ) {
        var a = handle.split('#');
        var id = a[a.length-1];
        var topic = handle.replace(/#\d+$/g,'');
        if (topic in this._evtMap) {
            var list = this._evtMap[ topic ];
            for (var j=0; j < list.length; j++) {
                if (id == list[j].id) {
                    list.splice(j,1);
                    this._evtNfo[ topic ].removed++;
                }
            }
        }
    },

    publish : function( /*topic, arg1, arg2, .., argN */ ) {
        var args = [].slice.call(arguments), 
            topic = args[0];
        if (topic in this._evtMap) {
            var list = this._evtMap[ topic ];
            for (var j=0; j<list.length; j++) {
                ('function' == typeof list[j].fn) && list[j].fn.apply( (list[j].ctx || self), args.slice(1) );
            }
        }
    }
}