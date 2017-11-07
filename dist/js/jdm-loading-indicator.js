angular.module('jdm.loadingIndicator', [
    'ngAnimate',
    'ngAria'
]);
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
        LoadingIndicatorButtonController.$inject = ["loadingIndicator"];
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

            vm.$onInit = function() {
                var referenceId = vm.referenceId || 0;

                loadingIndicator.initDirective(referenceId);

                vm.buttonClasses = vm.buttonClasses || '';
                vm.indicator = loadingIndicator.directives[referenceId];
            };

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

            vm.$onInit = function() {
                var referenceId = vm.referenceId || 0;

                loadingIndicator.initDirective(referenceId);

                vm.indicator = loadingIndicator.directives[referenceId];
            };
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

            vm.$onInit = function() {
                var referenceId = vm.referenceId || 0;

                loadingIndicator.initDirective(referenceId);
                
                vm.indicator = loadingIndicator.directives[referenceId];
            }
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .factory('loadingIndicatorInterceptor', LoadingIndicatorInterceptor);

    LoadingIndicatorInterceptor.$inject = ['$q', '$templateCache', 'loadingIndicator', '$timeout'];

    function LoadingIndicatorInterceptor($q, $templateCache, loadingIndicator, $timeout) {
        var waitingRequests = [];

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
            if (response !== undefined) {
                loadingIndicator.setLoadingState(false, response.config);

                for(var x = waitingRequests.length - 1; x >= 0 ; x--) {
                    if(waitingRequests[x] === response.config) {
                        waitingRequests.splice(x, 1);
                    }
                }
            }
        }

        function checkRequest(config) {
            // If the request is a get and the request url is not in $templateCache
            if (config.method === 'GET' || config.method === 'JSONP') {
                if ($templateCache.get(config.url) === undefined) {
                    waitForThreshold(config);
                }
            } else {
                waitForThreshold(config);
            }
        }

        function waitForThreshold(config) {
            waitingRequests.push(config);

            $timeout(function() {
                for(var x = 0; x < waitingRequests.length; x++) {
                    if(config === waitingRequests[x]) {
                        loadingIndicator.setLoadingState(true, config);
                    }
                }
            }, loadingIndicator.threshold);
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
            threshold = 250,
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
                threshold: threshold,
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
                    },
                    callTimeout: function() {
                        // Go ahead and remove the call if it passes a certain timeout - make it absuredly large
                        $timeout(function() {
                            deleteLoadingState(data);
                        }, 99999);
                    }
                };

                data.callTimeout();

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
angular.module("jdm.loadingIndicator").run(["$templateCache", function($templateCache) {$templateCache.put("templates/loading-indicator-button.tpl.html","<button type=\"button\" class=\"jdm-loading-container jdm-loading-indicator-button\" ng-disabled=\"loadingIndicatorButton.checkDisabled()\" ng-class=\"loadingIndicatorButton.wrapperClasses()\"> \r\n    <span class=\"jdm-loading-indicator-button__wrapper\">\r\n        <span class=\"jdm-loading jdm-loading--button\" ng-if=\"loadingIndicatorButton.isLoading || loadingIndicatorButton.indicator.requests.length\"> \r\n            <i class=\"jdm-loading__spinner jdm-loading__spinner--button\"></i>\r\n        </span>\r\n        \r\n        <span class=\"jdm-loading-indicator-button__content\" ng-transclude></span>\r\n    </span>\r\n</button>");
$templateCache.put("templates/loading-indicator-global.tpl.html","<span class=\"jdm-loading jdm-loading--global\" ng-if=\"loadingIndicator.isLoading || loadingIndicator.indicator.requests.length\">\r\n    <i class=\"jdm-loading__spinner jdm-loading__spinner--global\"></i> \r\n</span>");
$templateCache.put("templates/loading-indicator-inline.tpl.html","<span class=\"jdm-loading jdm-loading--inline\" ng-if=\"loadingIndicator.isLoading || loadingIndicator.indicator.requests.length\">\r\n    <i class=\"jdm-loading__spinner jdm-loading__spinner--inline\"></i> \r\n</span>");
$templateCache.put("templates/loading-indicator-progress.tpl.html","<span class=\"loading-container\"> \r\n     <span class=\"loading-item\"> \r\n         <progress max=\"{{ jdmLoadingService.directives[referenceId].total }}\" value=\"{{ jdmLoadingService.directives[referenceId].total - jdmLoadingService.directives[referenceId].messages.length }}\"></progress> \r\n     </span>\r\n</span>\r\n");}]);