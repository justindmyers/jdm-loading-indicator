angular.module('jdm.loadingIndicator', [
    'ngAnimate',
    'ngAria'
]);
 
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
        LoadingIndicatorController.$inject = ["loadingIndicator"];
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
        GlobalLoadingIndicatorController.$inject = ["loadingIndicator"];
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
            var referenceId = vm.referenceId || 0;

            loadingIndicator.initDirective(referenceId);
            
            vm.indicator = loadingIndicator.directives[referenceId];
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .factory('loadingIndicatorInterceptor', LoadingIndicatorInterceptor);

    LoadingIndicatorInterceptor.$inject = ['$q', '$templateCache', 'loadingIndicator', ];

    function LoadingIndicatorInterceptor($q, $templateCache, loadingIndicator) {
        return { 
            request: request,
            response: response,
            responseError: responseError 
        };

        // Exposed Functions
        function request(config) {
            checkRequest(config);
            return config;
        }
        
        function response(response) {
            checkResponse(response);
            return response;
        }
        
        function responseError(rejection) {
            checkResponse(rejection);
            return $q.reject(rejection);
        }
        
        // Internal Functions
        function checkResponse(response) {
            if (response !== undefined && $templateCache.get(response.config.url) === undefined) {
                loadingIndicator.setLoadingState(false, response.config);
            }
        }

        function checkRequest(config) {
            // If the request is a get and the request url is not in $templateCache
            if (config.method === 'GET') {
                if ($templateCache.get(config.url) === undefined) {
                    loadingIndicator.setLoadingState(true, config);
                }
            } else {
                loadingIndicator.setLoadingState(true, config);
            }
        }  
    }
})();
(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .provider('loadingIndicator', LoadingIndicatorProvider);
        
    function LoadingIndicatorProvider() {
        var referenceId = 0,
            threshold = 100,
            position = 'left';
            
        this.setDefaultReferenceId = function(defaultId) {
            referenceId = defaultId;
        };
        
        this.setDefaultPosition = function(defaultPosition) {
            position = defaultPosition;
        };
        
        this.setThreshold = function(defaultThreshold) {
            threshold = defaultThreshold;
        };

        this.$get = LoadingIndicatorService;
        
        LoadingIndicatorService.$inject = ['$timeout', '$rootScope'];
        
        function LoadingIndicatorService($timeout, $rootScope) {            
            var service = {
                directives: {},
                position: position,
                initDirective: initDirective,
                addLoadingState: addLoadingState,
                deleteLoadingState: deleteLoadingState,
                setLoadingState: setLoadingState
            };
            
            return service;
            
            // Exposed Functions
            function initDirective(referenceId) {
                service.directives[referenceId] = service.directives[referenceId] || preLoad(referenceId);
        
                return service.directives[referenceId];
            }
            
            function addLoadingState(data) {
                var directive = service.directives[data.referenceId] || preLoad(data.referenceId);

                if (data.isLoading) {
                    if (typeof directive.requests === 'undefined') {
                        directive.total = 0;
                        directive.requests = [];
                    }

                    directive.total++;
                    directive.requests.push(data);
                    
                    //Check by referenceID for broadcasts
                    if(directive.requests.length === 1) {
                        $rootScope.$emit('loadingIndicator:started', data);
                    }
                } else {
                    for (var x = 0; x < directive.requests.length; x++) {
                        //if the url's and referenceId's match, delete it
                        if (directive.requests[x].url === data.url && directive.requests[x].referenceId === data.referenceId) {
                            //We only want to destroy one request at a time, so break after
                            directive.requests[x].destroy();
                            directive.total--;
                            break;
                        }
                    }
                }

                return data;
            }

            function deleteLoadingState(data) {
                var requests = service.directives[data.referenceId].requests;
                var index = requests.indexOf(data);
                
                if (index > -1) {
                    requests.splice(index, 1);
                }
                
                if(requests.length === 0) {
                    $rootScope.$emit('loadingIndicator:stopped', data);
                }
            }
            
            function setLoadingState(isLoading, config) {
                var _config = config || {};
                
                if (angular.isUndefined(isLoading)) {
                    return;
                }

                var data = {
                    isLoading: isLoading,
                    url: _config.url,
                    position: _config.position || position,
                    referenceId: _config.referenceId || referenceId,
                    destroy: function() {
                        deleteLoadingState(data);
                    }
                };
                                
                return addLoadingState(data);
            }
            
            function preLoad(referenceId) {
                service.directives[referenceId] = {
                    requests: [],
                    total: 0
                };
                
                return service.directives[referenceId];
            }
        }
    }


})();
angular.module("jdm.loadingIndicator").run(["$templateCache", function($templateCache) {$templateCache.put("templates/loading-indicator-button.tpl.html","<button class=\"loading-container loading-button\" ng-disabled=\"checkDisabled()\" ng-class=\"wrapperClasses()\"> \n    <ng-transclude></ng-transclude>\n    <span class=\"loading-item\" ng-if=\"jdmLoadingService.directives[referenceId].messages.length\"> \n        <i class=\"jdm-loading-spinner\"></i>\n    </span>\n</button>");
$templateCache.put("templates/loading-indicator-global.tpl.html","<span class=\"jdm-loading\" ng-if=\"loadingIndicator.isLoading || loadingIndicator.indicator.requests.length\">\n    <i class=\"jdm-loading__spinner jdm-loading__spinner--global\"></i> \n</span>");
$templateCache.put("templates/loading-indicator-inline.tpl.html","<span class=\"jdm-loading jdm-loading--inline\" ng-if=\"loadingIndicator.isLoading || loadingIndicator.indicator.requests.length\">\n    <i class=\"jdm-loading__spinner jdm-loading__spinner--inline\"></i> \n</span>");
$templateCache.put("templates/loading-indicator-progress.tpl.html","\n<span class=\"loading-container\"> \n     <span class=\"loading-item\"> \n         <progress max=\"{{ jdmLoadingService.directives[referenceId].total }}\" value=\"{{ jdmLoadingService.directives[referenceId].total - jdmLoadingService.directives[referenceId].messages.length }}\"></progress> \n     </span>\n</span>\n");}]);