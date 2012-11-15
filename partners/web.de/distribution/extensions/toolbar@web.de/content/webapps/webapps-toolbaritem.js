
var logic = {}
Components.utils.import("resource://unitedtb/email/webapp-start.js", logic);

/**
 * User clicked on Weather button
 */
function startUsecase(usecase)
{
  try {
    // ensure that we have a primary account, and it's logged in
    notifyWindowObservers("do-login", {
      withUI : true,
      needAccountType : 1, // primary account
      successCallback : function(primaryAccount)
      {
        // do real stuff
        logic.startUsecase(primaryAccount, usecase, [], window);
      },
      // errorCallback default: show errors
      // abortCallback default: do nothing
    });
  } catch (e) { errorCritical(e); }
};