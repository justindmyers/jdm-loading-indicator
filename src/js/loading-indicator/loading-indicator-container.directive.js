(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .directive('loadingIndicatorContainer', LoadingIndicator);

    LoadingIndicator.$inject = ['loadingIndicator'];
    
    function LoadingIndicator() {
        // Usage: <div loading-indicator-container></div>
        //
        // Creates:
        //
        var directive = {
            restrict: 'A',
            scope: {},
            link: link
        }; 
        
        return directive;
        
        function link(scope, element, attrs) {
            element[0].classList.add('jdm-loading-container');
        }
    }
})();