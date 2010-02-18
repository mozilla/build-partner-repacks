/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Feedback"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

/**
 * Feedback object
 * @param aType the type of the alert
 * @param aObject used to hold the item that caused the alert or the feedback
 * information in case of feedback alerts
 */
function Feedback() {
  this._score = -1;
}

Feedback.MILESTONES =
  [ 10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000 ];

Feedback.prototype = {
  /**
   * Used to determine the type of the object
   */
  constructor : Feedback,

  /**
   * Returns the score of the feedback
   */
  get score() {
    return this._score;
  },

  /**
   * Sets the score of the feedback
   */
  set score(aValue) {
    this._score = aValue;
  },

  /**
   * Obtains a star index that corresponds to this feedback (if a score
   * adjustment feedback)
   * @return the star index that corresponds to the this feedback score. -1 if
   * it doesn't match any star.
   */
  getStarIndex : function() {
    var starIndex = -1;
    if (Feedback.MILESTONES[0] <= this.score) {
      var listLength = Feedback.MILESTONES.length;
      for (var i = 0; i < listLength; i++) {
        if (Feedback.MILESTONES[i] <= this.score) {
          starIndex = i;
        } else {
          break;
        }
      }
    }
    return starIndex;
  }

};
