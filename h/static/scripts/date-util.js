'use strict';

// cached date formatting instance.
// See https://github.com/hypothesis/h/issues/2820#issuecomment-166285361
var dateTimeFormatter;
var dateFormatter;

/**
 * Returns a short localized representation of a date.
 *
 * @param {Date} date - The date to format.
 */
function formatDate(date) {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    if (!dateFormatter) {
      dateFormatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    }
    return dateFormatter.format(date);
  } else {
    // IE < 11, Safari <= 9.0
    return date.toDateString();
  }
}

/**
 * Returns a standard human-readable representation
 * of a date and time.
 *
 * @param {Date} date - The date to format.
 */
function format(date) {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    if (!dateTimeFormatter) {
      dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return dateTimeFormatter.format(date);
  } else {
    // IE < 11, Safari <= 9.0.
    // In English, this generates the string most similar to
    // the toLocaleDateString() result above.
    return date.toDateString() + ' ' + date.toLocaleTimeString();
  }
}

module.exports = {
  format: format,
  formatDate: formatDate,
};
