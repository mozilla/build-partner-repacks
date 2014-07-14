"use strict";
EXPORTED_SYMBOLS.push("Base");
function Class($super, $members, $statics) {
    if ($members.constructor && $members.constructor.name !== "Object") {
        $members.$constructor = $members.constructor;
        delete $members.constructor;
    }
    var $class = function $class() {
        if ("$constructor" in this)
            this.$constructor.apply(this, arguments);
    };
    var prototype = {};
    if ($super) {
        prototype = Object.create($super.prototype);
        prototype.constructor = $class;
    }
    $class.$super = $super;
    $class.prototype = prototype;
    prototype.$class = $class;
    prototype.$super = $super ? $super.prototype : null;
    prototype.$name = $members.$name || ($members.$constructor ? $members.$constructor.name : "");
    Class.$implement($class, $members, $statics);
    return $class;
}
function wrapMethod(method) {
    var baseMethod = method.$class && method.$class.$super && method.$class.$super.prototype[method.$name];
    if (!baseMethod)
        return method;
    var wrapper = function wrapper() {
        var savedBaseMethod = this.base;
        this.base = baseMethod;
        try {
            return method.apply(this, arguments);
        } finally {
            this.base = savedBaseMethod;
        }
    };
    wrapper.$class = method.$class;
    wrapper.$name = method.$name;
    return wrapper;
}
const specials = [
        "$class",
        "$name",
        "$super"
    ];
Class.$copy = function $copy($source, $target, $class) {
    for (let name in $source) {
        if (specials.indexOf(name) != -1)
            continue;
        let getter = $source.__lookupGetter__(name);
        let setter = $source.__lookupSetter__(name);
        if (getter || setter) {
            if (getter) {
                if (getter.$class)
                    getter = eval(getter.toString());
                getter.$class = $class;
                getter.$name = name;
                $target.__defineGetter__(name, wrapMethod(getter));
            }
            if (setter) {
                if (setter.$class)
                    setter = eval(setter.toString());
                setter.$class = $class;
                setter.$name = name;
                $target.__defineSetter__(name, wrapMethod(setter));
            }
        } else {
            let member = $source[name];
            if (typeof member == "function") {
                member.$class = $class;
                member.$name = name;
                $target[name] = wrapMethod(member);
            } else
                $target[name] = member;
        }
    }
};
Class.$implement = function $implement($class, $members, $statics) {
    Class.$copy($members, $class.prototype, $class);
    if ($statics)
        Class.$copy($statics, $class, null);
};
var Base = Class(null, {
        extend: function Base_extend($members) {
            Class.$copy($members, this, this.$class);
            return this;
        },
        base: function Base_base() {
        }
    }, {
        ancestorOf: function Base_$ancestorOf($class) {
            while ($class) {
                $class = $class.$super;
                if ($class == this)
                    return true;
            }
            return false;
        },
        inherits: function Base_$inherits($class) {
            return $class.ancestorOf(this);
        },
        extend: function Base_$extend(members, statics) {
            statics = statics || {};
            statics.extend = this.extend;
            statics.implement = this.implement;
            statics.ancestorOf = this.ancestorOf;
            statics.inherits = this.inherits;
            return Class(this, members || {}, statics);
        },
        implement: function Base_$implement(members, statics) {
            if (members.prototype)
                Class.$implement(this, members.prototype, members);
            else
                Class.$implement(this, members, statics);
            return this;
        }
    });
