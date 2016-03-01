'use strict';

var BASELINE_GRID_STYLE = {
  lineWidth: 1.0,
  strokeStyle: 'rgba(0,0,0,0.05)',
};

var ACTIVE_LINE_STYLE = {
  lineWidth: 2.0,
  strokeStyle: 'rgba(0,0,0,0.2)',
};

function renderGridLines(canvas, opts) {
  var rect = canvas.getBoundingClientRect();
  var ctx = canvas.getContext('2d');
  var gridSpacing = opts.baselineSpacing;

  ctx.clearRect(0, 0, rect.width, rect.height);

  if (!opts.showGrid) {
    return;
  }

  Object.assign(ctx, BASELINE_GRID_STYLE);

  // Draw the grid. The 0.5px offset is to ensure a sharp
  // grid line
  for (var x = gridSpacing + 0.5; x < rect.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }

  for (var y = gridSpacing + 0.5; y < rect.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Highlight the current line
  if (opts.activeRowY) {
    Object.assign(ctx, ACTIVE_LINE_STYLE);

    ctx.beginPath();
    ctx.moveTo(0, opts.activeRowY);
    ctx.lineTo(rect.width, opts.activeRowY);
    ctx.stroke();
  }

  if (opts.activeColX) {
    Object.assign(ctx, ACTIVE_LINE_STYLE);

    ctx.beginPath();
    ctx.moveTo(opts.activeColX, 0);
    ctx.lineTo(opts.activeColX, rect.height);
    ctx.stroke();
  }
}

/**
 * Round a number to the nearest @p resolution units.
 *
 * @param {number} val
 * @param {number} resolution
 */
function roundTo(val, resolution) {
  return Math.round((val + resolution/2) / resolution) * resolution;
}

/**
 * A component that displays a feint grid on top of the window content.
 *
 * This is a development utility that displays a feint grid on top of
 * the window content, for use in ensuring that elements on the page
 * are aligned correctly.
 */
// @ngInject
module.exports = function ($window) {
  return {
    restrict: 'E',
    link: function (scope, element) {
      var canvas = element[0].querySelector('.js-design-grid');

      function resizeCanvasToViewport() {
        canvas.width = $window.innerWidth;
        canvas.height = $window.innerHeight;
      }

      var opts = {
        baselineSpacing: 10,
        showGrid: false,
      };

      $window.addEventListener('resize', function () {
        resizeCanvasToViewport();
        renderGridLines(canvas, opts);
      });

      document.addEventListener('keypress', function (event) {
        if (event.key === 'd' && event.ctrlKey) {
          event.preventDefault();
          opts.showGrid = !opts.showGrid;
          renderGridLines(canvas, opts);
        }
      });

      document.addEventListener('mousemove', function (event) {
        if (!opts.showGrid) {
          return;
        }
        renderGridLines(canvas, Object.assign({}, opts, {
          activeRowY: roundTo(event.clientY, opts.baselineSpacing),
          activeColX: roundTo(event.clientX, opts.baselineSpacing),
        }));
      });

      document.addEventListener('mouseleave', function () {
        renderGridLines(canvas, opts);
      });

      resizeCanvasToViewport();
      renderGridLines(canvas, opts);
    },
    template: '<canvas class="design-grid js-design-grid"></canvas>',
  };
};