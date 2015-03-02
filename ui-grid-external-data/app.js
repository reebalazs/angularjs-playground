/* global angular: true */
/* jshint globalstrict: true */

(function() {
  'use strict';
  angular.module('myApp', [
    'ngTouch',
    'ui.grid',
    'ui.grid.pagination'
  ]);

  angular.module('myApp').factory('usersService',
    function($http) {
      var getUsersRequest = function(paginationOptions) {
        var url = '/users?pageNumber=' + paginationOptions.pageNumber + '&pageSize=' + paginationOptions.pageSize;
        return $http({
          method: 'GET',
          url: url
        });
      };
      return {
        users: function(paginationOptions) {
          return getUsersRequest(paginationOptions);
        }
      };
    }
  );

  // Update grid height, if the pagination changes.
  // Also correct for a bug which does not acknowledge the height of the pager,
  // this must be fixed both at startup time, and on pagination change events.
  // Paginator height must be added manually, otherwise it
  // takes it off from the viewport area, and we have about one less row.
  // This seems like a bug that occurs in connection with batched (non-scrolling) mode.
  angular.module('myApp').directive('fixGridResize', ['$timeout', 'gridUtil', function($timeout, gridUtil) {
    return {
      require: 'uiGrid',
      scope: false,
      link: function($scope, $elm, $attrs, uiGridCtrl) {
        var grid = uiGridCtrl.grid;
        function fixGridHeight() {
          var elPager = angular.element($elm[0].querySelector('.ui-grid-pager-panel'));
          // Update row height based on the pagination page size.
          // Also add paginator height.
          var paginatorHeight = gridUtil.elementHeight(elPager);
          grid.gridHeight =  grid.headerHeight + grid.options.rowHeight * grid.options.paginationPageSize +
            paginatorHeight;
          $elm.css('height', '' + grid.gridHeight + 'px');
          grid.refresh();
        }
        grid.api.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
          fixGridHeight();
        });
        $timeout(fixGridHeight);
      }
    };
  }]);

  angular.module('myApp').controller('TableController',
    function($scope, $timeout, uiGridConstants, usersService) {

      var paginationOptions = {
        pageNumber: 1,
        pageSize: 10,
        sort: null
      };

      // grid options
      $scope.gridOptions = {
        enableHorizontalScrollbar: 0,
        enableVerticalScrollbar: 0,
        enablePaginationControls: true,
        paginationPageSizes: [10, 25, 50, 75],
        paginationPageSize: 10,
        //minRowsToShow: 10,
        useExternalPagination: true,
        useExternalSorting: true,
        columnDefs: [
          {name: 'id', enableSorting: false},
          {name: 'name'},
          {name: 'age', enableSorting: false}
        ],
        onRegisterApi: function(gridApi) {
          $scope.gridApi = gridApi;
          $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
            if (sortColumns.length === 0) {
              paginationOptions.sort = null;
            } else {
              paginationOptions.sort = sortColumns[0].sort.direction;
            }
            getPage();
          });
          gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
            paginationOptions.pageNumber = newPage;
            paginationOptions.pageSize = pageSize;
            getPage();
          });
        },
      };

      var getPage = function() {
        usersService.users(paginationOptions).success(function(data, status) {
          $scope.gridOptions.totalItems = data.count;
          var firstRow = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
          $scope.gridOptions.data = data.results;
        });
      };

      getPage();

    }
  );

  angular.module('myApp').filter('range', function() {
    return function(input, total) {
      total = parseInt(total);
      for (var i = 0; i < total; i++) {
        input.push(i);
      }
      return input;
    };
  });

})();
