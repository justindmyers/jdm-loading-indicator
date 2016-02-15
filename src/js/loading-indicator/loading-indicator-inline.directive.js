(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .directive('loadingIndicator', LoadingIndicator);

    LoadingIndicator.$inject = ['loadingIndicator'];
    
    function LoadingIndicator() {
        // Usage: <loading-indicator></loading-indicator>
        //
        // Creates:
        //
        var directive = {
            restrict: 'E',
            requires: '^loadingIndicatorContainer',
            controller: LoadingIndicatorController,
            controllerAs: 'loadingIndicator', 
            bindToController: {
                referenceId: '@',
                isLoading: '='
            },
            scope: {},
            templateUrl: 'templates/loading-indicator-inline.tpl.html',
        }; 
        
        return directive;
             
        /* @ngInject */
        function LoadingIndicatorController (loadingIndicator) {
            var vm = this;
            var referenceId = vm.referenceId || 0;

            loadingIndicator.initDirective(referenceId);
            
            vm.indicator = loadingIndicator.directives[referenceId];
        }
    }
})();