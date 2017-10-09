(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .directive('globalLoadingIndicator', GlobalLoadingIndicator);

    GlobalLoadingIndicator.$inject = ['loadingIndicator'];
    
    function GlobalLoadingIndicator() {
        // Usage: <global-loading-indicator></global-loading-indicator>
        //
        // Creates:
        //
        var directive = {
            restrict: 'E',
            controller: GlobalLoadingIndicatorController,
            controllerAs: 'loadingIndicator', 
            bindToController: {
                referenceId: '@',
                isLoading: '='
            },
            scope: {},
            templateUrl: 'templates/loading-indicator-global.tpl.html',
        }; 
        
        return directive;
             
        /* @ngInject */
        function GlobalLoadingIndicatorController (loadingIndicator) {
            var vm = this;

            vm.$onInit = function() {
                var referenceId = vm.referenceId || 0;

                loadingIndicator.initDirective(referenceId);
                
                vm.indicator = loadingIndicator.directives[referenceId];
            }
        }
    }
})();