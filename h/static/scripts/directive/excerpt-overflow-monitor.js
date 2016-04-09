'use strict';

function toPx(val) {
  return val.toString() + 'px';
}

/**
 * A helper for the <excerpt> component which handles determinination of the
 * overflow state and content styling given the current state of the component
 * and the height of its contents.
 *
 * Recalculations are debounced to minimize forced layouts.
 *
 * @param {OverflowCtrl} ctrl - Interface used by ExcerptOverflowMonitor to
 *         query the current state of the excerpt and notify it when the
 *         overflow state changes.
 * @param {(callback) => number} requestAnimationFrame -
 *        Function called to schedule an async recalculation of the overflow
 *        state
 */
function ExcerptOverflowMonitor(ctrl, requestAnimationFrame) {
  var pendingOverflowCheck = false;
  var prevOverflowing;

  /**
   * Recompute whether the excerpt's content is overflowing the collapsed
   * element.
   *
   * This check is scheduled manually in response to changes in the inputs
   * to this component and certain events to avoid excessive layout flushes
   * caused by accessing the element's size.
   */
  function recomputeOverflowState() {
    var state = ctrl.getState();

    if (!pendingOverflowCheck) {
      return;
    }

    pendingOverflowCheck = false;

    var overflowing = false;
    if (state.enabled) {
      var hysteresisPx = state.overflowHysteresis || 0;
      overflowing = ctrl.contentHeight() >
             (state.collapsedHeight + hysteresisPx);
    }
    if (overflowing === prevOverflowing) {
      return;
    }

    prevOverflowing = overflowing;
    ctrl.onOverflowChanged(overflowing);
  }

  // Schedule a deferred check of whether the content is collapsed.
  function scheduleOverflowCheck() {
    if (pendingOverflowCheck) {
      return;
    }
    pendingOverflowCheck = true;
    requestAnimationFrame(function () {
      recomputeOverflowState();
    });
  }

  /**
   * Returns an object mapping CSS properties to values that should be applied
   * to an excerpt's content element in order to truncate it based on the
   * current overflow state.
   */
  function contentStyle() {
    var state = ctrl.getState();
    if (!state.enabled) {
      return {};
    }

    var maxHeight = '';
    if (prevOverflowing) {
      if (state.collapse) {
        maxHeight = toPx(state.collapsedHeight);
      } else if (state.animate) {
        // Animating the height change requires that the final
        // height be specified exactly, rather than relying on
        // auto height
        maxHeight = toPx(ctrl.contentHeight());
      }
    } else if (typeof prevOverflowing === 'undefined' &&
               state.collapse) {
      // If the excerpt is collapsed but the overflowing state has not yet
      // been computed then the exact max height is unknown, but it will be
      // in the range [state.collapsedHeight, state.collapsedHeight +
      // state.overflowHysteresis]
      //
      // Here we guess that the final content height is most likely to be
      // either less than `collapsedHeight` or more than `collapsedHeight` +
      // `overflowHysteresis`, in which case it will be truncated to
      // `collapsedHeight`.
      maxHeight = toPx(state.collapsedHeight);
    }

    return {
      'max-height': maxHeight,
    };
  }

  this.contentStyle = contentStyle;
  this.scheduleOverflowCheck = scheduleOverflowCheck;
}

module.exports = ExcerptOverflowMonitor;
