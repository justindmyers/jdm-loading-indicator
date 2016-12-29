 (function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .directive('loadingIndicatorButton', LoadingIndicatorButton);

    LoadingIndicatorButton.$inject = ['loadingIndicator'];
    
    function LoadingIndicatorButton() {
        // Usage: <global-loading-indicator></global-loading-indicator>
        //
        // Creates:
        //
        var directive = {
            restrict: 'E',
            controller: LoadingIndicatorButtonController,
            controllerAs: 'loadingIndicatorButton', 
            bindToController: {
                buttonClasses: '@',
                referenceId: '@',
                isLoading: '<',
                indicatorPosition: '@',
                disableOnPendingRequest: '@',
                buttonDisabled: '<',
                isDarkTheme: '@'
            },
            scope: {},
            transclude: true,
            templateUrl: 'templates/loading-indicator-button.tpl.html',
        }; 
        
        return directive;
             
        /* @ngInject */
        function LoadingIndicatorButtonController (loadingIndicator) {
            var vm = this;
            var referenceId = vm.referenceId || 0;

            loadingIndicator.initDirective(referenceId);
            
            vm.buttonClasses = vm.buttonClasses || '';
            vm.indicator = loadingIndicator.directives[referenceId];

            vm.checkDisabled = function() {                
                if(vm.buttonDisabled) {
                    return true;
                }
                
                if(vm.indicator.requests.length && vm.disableOnPendingRequest) {
                    return true;
                }                       
            };

            vm.wrapperClasses = function() {
                var classes = {};

                vm.buttonClasses.split(' ').forEach(function(classname) {
                    classes[classname] = true;
                });

                if(vm.isDarkTheme) {
                    classes['jdm-loading-indicator-button--dark'] = true;
                }

                if(vm.indicator.requests.length || vm.isLoading) {
                    classes['jdm-loading-indicator-button--loading'] = true;
                }

                if(vm.indicator.requests.length && vm.disableOnPendingRequest || vm.buttonDisabled) {
                    classes['disabled'] = true;
                }
                
                if(angular.isDefined(vm.indicatorPosition)) {
                    classes['jdm-loading-indicator-button--loading-' + vm.indicatorPosition] = true;
                } else {
                    classes['jdm-loading-indicator-button--loading-' + loadingIndicator.position] = true;
                }
                
                return classes;
            };
        }
    }
})();