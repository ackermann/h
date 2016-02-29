'use strict';

var dateUtil = require('./date-util');

var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var month = day * 30;

var BREAKPOINTS = [
  [30,         'Just now',    1],
  [minute,     '{} sec', 1],
  [hour,       '{} min', minute],
  [day,        '{} hr',   hour],
  [month,      '{} days',    day],

  // Use an absolute date for dates older than
  // a month
  [Infinity,   '',   undefined]
];

function getBreakpoint(date) {
  var delta = Math.round((new Date() - new Date(date)) / 1000);
  var breakpoint;

  for (var i = 0; i < BREAKPOINTS.length; i++) {
    if (BREAKPOINTS[i][0] > delta) {
      breakpoint = BREAKPOINTS[i];
      break;
    }
  }

  return {
    delta: delta,
    breakpoint: breakpoint,
  };
}

/**
 * Returns the delay before a timestamp formatted with toFuzzyString()
 * should be refreshed.
 *
 * @return {number?} - The minimum delay before a timestamp should
 *                     be refreshed or null if the formatted output will
 *                     never change.
 */
function nextFuzzyUpdate(date) {
  if (!date) {
    return null;
  }

  var breakpoint = getBreakpoint(date).breakpoint;
  if (!breakpoint) {
    return null;
  }

  var secs = breakpoint[2];
  if (!secs) {
    return null;
  }

  // We don't want to refresh anything more often than 5 seconds
  secs = Math.max(secs, 5);

  // setTimeout limit is MAX_INT32=(2^31-1) (in ms),
  // which is about 24.8 days. So we don't set up any timeouts
  // longer than 24 days, that is, 2073600 seconds.
  secs = Math.min(secs, 2073600);

  return secs;
}

/**
 * Starts an interval whose frequency decays depending on the relative
 * age of 'date'.
 *
 * This can be used to refresh parts of a UI whose
 * update frequency depends on the age of a timestamp.
 *
 * @return {Function} A function that cancels the automatic refresh.
 */
function decayingInterval(date, callback) {
  var timer;
  var update = function () {
    var fuzzyUpdate = nextFuzzyUpdate(date);
    if (!fuzzyUpdate) {
      return;
    }
    var nextUpdate = (1000 * fuzzyUpdate) + 500;
    timer = setTimeout(function () {
      callback(date);
      update();
    }, nextUpdate);
  };
  update();

  return function () {
    clearTimeout(timer);
  };
}

/**
 * Formats a date as a string relative to the current date.
 *
 * @param {number} date - The absolute timestamp to format.
 * @return {string} A 'fuzzy' string describing the relative age of the date.
 */
function toFuzzyString(date) {
  if (!date) {
    return '';
  }
  var breakpointInfo = getBreakpoint(date);
  var breakpoint = breakpointInfo.breakpoint;
  var delta = breakpointInfo.delta;
  if (!breakpoint) {
    return '';
  }
  var template = breakpoint[1];
  var resolution = breakpoint[2];

  if (!resolution) {
    return dateUtil.formatDate(new Date(date));
  }

  return template.replace('{}', String(Math.floor(delta / resolution)));
}

module.exports = {
  decayingInterval: decayingInterval,
  nextFuzzyUpdate: nextFuzzyUpdate,
  toFuzzyString: toFuzzyString,
};
