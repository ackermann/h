'use strict';

var angular = require('angular');

var events = require('./events');

// @ngInject
module.exports = function WidgetController(
  $scope, $rootScope, annotationUI, crossframe, annotationMapper,
  drafts, groups, streamer, streamFilter, store, threading, settings
) {
  $scope.threadRoot = threading.root;
  $scope.sortOptions = ['Newest', 'Oldest', 'Location'];

  var DEFAULT_CHUNK_SIZE = 200;
  var loaded = [];

  var _resetAnnotations = function () {
    // Unload all the annotations
    annotationMapper.unloadAnnotations(threading.annotationList());
    // Reload all the drafts
    threading.thread(drafts.unsaved());
  };

  // ID of annotation to select when application initially loads

  // FIXME: This ends up being re-initialized when signing in/out because
  // the whole app is reloaded. We want to clear this however whenever the
  // user changes the selection.
  var selectOnLoadID = settings.annotations;
  // True if annotations are currently being loaded from the H
  // service
  var loadInProgress = false;

  var _loadAnnotationsFrom = function (query, offset, allResults) {
    loadInProgress = true;
    allResults = allResults || [];

    var queryCore = {
      limit: $scope.chunkSize || DEFAULT_CHUNK_SIZE,
      offset: offset,
      sort: 'created',
      order: 'asc',
    };

    // If annotation IDs to select when the app loads have been specified,
    // fetch annotations from all groups and then filter out those which are
    // not in the same group has the selected annotation
    if (!selectOnLoadID) {
      queryCore.group = groups.focused().id;
    }
    var q = angular.extend(queryCore, query);
    q._separate_replies = true;

    store.SearchResource.get(q, function (results) {
      var total = results.total;
      offset += results.rows.length;
      allResults = allResults.concat(results.rows, results.replies);
      if (offset < total) {
        _loadAnnotationsFrom(query, offset, allResults);
      } else {
        // If annotations should be selected when the app loads,
        // we need to
        if (selectOnLoadID) {
          var selectMatch = allResults.find(function (annot) {
            return annot.id === selectOnLoadID;
          });
          // Clear the select-on-load ID so that when the user switches
          // groups in future, we do not focus that annotation
          selectOnLoadID = null;
          if (selectMatch) {
            groups.focus(selectMatch.group);
            allResults = allResults.filter(function (annot) {
              return annot.group === selectMatch.group;
            });
            annotationUI.selectAnnotations([selectMatch]);
          } else {
            annotationUI.selectAnnotations([{id: selectOnLoadID}]);
          }
        }

        loadInProgress = false;
        annotationMapper.loadAnnotations(allResults);
      }
    });
  };

  var loadAnnotations = function (frames) {
    for (var i = 0, f; i < frames.length; i++) {
      f = frames[i];
      var ref;
      if (ref = f.uri, loaded.indexOf(ref) >= 0) {
        continue;
      }
      loaded.push(f.uri);
      _loadAnnotationsFrom({uri: f.uri}, 0);
    }

    if (loaded.length > 0) {
      streamFilter.resetFilter().addClause('/uri', 'one_of', loaded);
      streamer.setConfig('filter', {filter: streamFilter.getFilter()});
    }
  };

  $scope.$on(events.GROUP_FOCUSED, function () {
    _resetAnnotations(annotationMapper, drafts, threading);
    loaded = [];
    return loadAnnotations(crossframe.frames);
  });

  $scope.$watchCollection(function () {
    return crossframe.frames;
  }, loadAnnotations);

  $scope.focus = function (annotation) {
    var highlights = [];
    if (angular.isObject(annotation)) {
      highlights = [annotation.$$tag];
    }
    return crossframe.call('focusAnnotations', highlights);
  };

  $scope.scrollTo = function (annotation) {
    if (angular.isObject(annotation)) {
      return crossframe.call('scrollToAnnotation', annotation.$$tag);
    }
  };

  $scope.hasFocus = function (annotation) {
    if (!annotation || !$scope.focusedAnnotations) {
      return false;
    }
    return annotation.$$tag in $scope.focusedAnnotations;
  };

  $scope.unavailableAnnotationsSelected = function () {
    var unavailable = Object.keys(annotationUI.selectedAnnotationMap || {})
      .filter(function (id) {
        return !threading.idTable.hasOwnProperty(id);
      });
    return !loadInProgress && unavailable.length > 0;
  };

  $rootScope.$on('beforeAnnotationCreated', function (event, data) {
    if (data.$highlight || (data.references && data.references.length > 0)) {
      return;
    }
    return $scope.clearSelection();
  });
};
