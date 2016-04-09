'use strict';

var angular = require('angular');

var util = require('./util');
var excerpt = require('../excerpt');

/**
 * Wait for an <excerpt> to recompute its overflowing state.
 *
 * This happens asynchronously after an <excerpt> is created in order to wait
 * for Angular directives used by the <excerpt>'s content to fully resolve.
 *
 * @return {Promise}
 */
function waitForLayout(element) {
  element.scope.$digest();
  return new Promise(function (resolve) {
    window.requestAnimationFrame(resolve);
  });
}

describe('excerpt directive', function () {
  var SHORT_DIV = '<div id="foo" style="height:5px;"></div>';
  var TALL_DIV =  '<div id="foo" style="height:200px;">foo bar</div>';

  function excerptDirective(attrs, content) {
    var defaultAttrs = {
      // disable animation so that expansion/collapse happens immediately
      // when the controls are toggled in tests
      animate: false,
      enabled: true,
      collapsedHeight: 40,
      inlineControls: false,
    };
    attrs = Object.assign(defaultAttrs, attrs);
    return util.createDirective(document, 'excerpt', attrs, {}, content);
  }

  function height(el) {
    return el.querySelector('.excerpt').offsetHeight;
  }

  before(function () {
    angular.module('app', [])
      .directive('excerpt', excerpt.directive);
  });

  beforeEach(function () {
    angular.mock.module('app');
  });

  describe('enabled state', function () {
    it('renders its contents in a .excerpt element by default', function () {
      var element = excerptDirective({}, '<span id="foo"></span>');

      assert.equal(element.find('.excerpt #foo').length, 1);
    });

    it('when enabled, renders its contents in a .excerpt element', function () {
      var element = excerptDirective({enabled: true}, '<span id="foo"></span>');

      assert.equal(element.find('.excerpt #foo').length, 1);
    });

    it('when disabled, renders its contents but not in a .excerpt element', function () {
      var element = excerptDirective({enabled: false}, '<span id="foo"></span>');

      assert.equal(element.find('.excerpt #foo').length, 0);
      assert.equal(element.find('#foo').length, 1);
    });

    it('truncates long contents when enabled', function () {
      var element = excerptDirective({enabled: false}, TALL_DIV);
      element.scope.enabled = true;
      return waitForLayout(element).then(function () {
        assert.isBelow(height(element[0]), 100);
      });
    });
  });

  function isHidden(el) {
    return !el.offsetParent || el.classList.contains('ng-hide');
  }

  function findVisible(el, selector) {
    var elements = el.querySelectorAll(selector);
    for (var i=0; i < elements.length; i++) {
      if (!isHidden(elements[i])) {
        return elements[i];
      }
    }
    return undefined;
  }

  describe('inline controls', function () {
    function findInlineControl(el) {
      return findVisible(el, '.excerpt__toggle-link');
    }

    it('displays inline controls if collapsed', function () {
      var element = excerptDirective({inlineControls: true},
        TALL_DIV);
      return waitForLayout(element).then(function () {
        var expandLink = findInlineControl(element[0]);
        assert.ok(expandLink);
        assert.equal(expandLink.querySelector('a').textContent, 'More');
      });
    });

    it('does not display inline controls if not collapsed', function () {
      var element = excerptDirective({inlineControls: true},
        SHORT_DIV);
      var expandLink = findInlineControl(element[0]);
      assert.notOk(expandLink);
    });

    it('toggles the expanded state when clicked', function () {
      var element = excerptDirective({inlineControls: true},
        TALL_DIV);
      return waitForLayout(element).then(function () {
        var expandLink = findInlineControl(element[0]);
        angular.element(expandLink.querySelector('a')).click();
        element.scope.$digest();
        var collapseLink = findInlineControl(element[0]);
        assert.equal(collapseLink.querySelector('a').textContent, 'Less');
      });
    });
  });

  describe('bottom area', function () {
    it('expands the excerpt when clicking at the bottom if collapsed', function () {
      var element = excerptDirective({inlineControls: true},
        TALL_DIV);
      element.scope.$digest();
      assert.isTrue(element.ctrl.collapse);
      var bottomArea = element[0].querySelector('.excerpt__shadow');
      angular.element(bottomArea).click();
      assert.isFalse(element.ctrl.collapse);
    });
  });

  describe('.collapse', function () {
    it('collapses the body if collapse is true', function () {
      var element = excerptDirective({collapse: true}, TALL_DIV);
      return waitForLayout(element).then(function () {
        assert.isBelow(height(element[0]), 100);
      });
    });

    it('does not collapse the body if collapse is false', function () {
      var element = excerptDirective({collapse: false}, TALL_DIV);
      return waitForLayout(element).then(function () {
        assert.isAbove(height(element[0]), 100);
      });
    });
  });

  describe('.onCollapsibleChanged', function () {
    it('reports true if excerpt is tall', function () {
      var callback = sinon.stub();
      var element = excerptDirective({
        onCollapsibleChanged: {
          args: ['collapsible'],
          callback: callback,
        }
      }, TALL_DIV);
      return waitForLayout(element).then(function () {
        assert.calledWith(callback, true);
      });
    });

    it('reports false if excerpt is short', function () {
      var callback = sinon.stub();
      var element = excerptDirective({
        onCollapsibleChanged: {
          args: ['collapsible'],
          callback: callback,
        }
      }, SHORT_DIV);
      return waitForLayout(element).then(function () {
        assert.calledWith(callback, false);
      });
    });
  });

  describe('overflowHysteresis', function () {
    it('does not collapse if overflow is less than hysteresis', function () {
      var slightlyOverflowingDiv = '<div class="foo" style="height:45px;"></div>';
      var element = excerptDirective({
        collapsedHeight: 40,
        overflowHysteresis: 10,
      }, slightlyOverflowingDiv);
      return waitForLayout(element).then(function () {
        assert.isAbove(height(element[0]), 44);
      });
    });

    it('does collapse if overflow exceeds hysteresis', function () {
      var overflowingDiv = '<div style="height:60px;"></div>';
      var element = excerptDirective({
        collapsedHeight: 40,
        overflowHysteresis: 10,
      }, overflowingDiv);
      return waitForLayout(element).then(function () {
        assert.isBelow(height(element[0]), 50);
      });
    });
  });
});
