function onLoad()
{
  new CouponCheckbox();
}
window.addEventListener("load", onLoad, false);

/**
 * With this, we're saving a UI checkbox for the module enable.
 * If both coupon alerts are unchecked, we disable the module.
 * Otherwise, it's the module is enabled.
 *
 * When both alerts are unchecked, we go back to the default
 * state, which is: module disabled, both alerts enabled.
 * And this is why we're not using AutoPrefElement for these.
 */
function CouponCheckbox()
{
  SettingElement.call(this, E("coupon-dummy-checkbox"));
}
CouponCheckbox.prototype =
{
  get storeValue() {
    this.read();
    return true; // dummy
  },
  set storeValue(val) {
    return;
  },
  // read from prefs, set UI
  read : function () {
    if (ourPref.get("coupon.enabled")) {
      E("coupon-coupons-checkbox").checked = ourPref.get("coupon.coupons.show");
      E("coupon-rewards-checkbox").checked = ourPref.get("coupon.rewards.show");
    } else {
      E("coupon-coupons-checkbox").checked = false;
      E("coupon-rewards-checkbox").checked = false;
    }
  },
  save : function() {
    var couponsShow = E("coupon-coupons-checkbox").checked;
    var rewardsShow = E("coupon-rewards-checkbox").checked;
    if (couponsShow || rewardsShow) {
      ourPref.set("coupon.enabled", true);
      ourPref.set("coupon.coupons.show", couponsShow);
      ourPref.set("coupon.rewards.show", rewardsShow);
    } else {
      // see comment above
      ourPref.set("coupon.enabled", false);
      ourPref.set("coupon.coupons.show", true);
      ourPref.set("coupon.rewards.show", true);
    }
  },
  reset : function() {
    E("coupon-coupons-checkbox").checked = ourPref.get("coupon.enabled");
    E("coupon-rewards-checkbox").checked = ourPref.get("coupon.enabled");
  }
}
extend(CouponCheckbox, SettingElement);
