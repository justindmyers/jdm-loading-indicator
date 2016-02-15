'use strict';

/**
 * @ngdoc overview
 * @name jdmLoadingIndicatorApp
 * @description
 * # jdmLoadingIndicatorApp
 *
 * Main module of the application.
 */
angular
  .module('jdmLoadingIndicatorApp', [
    'ngMockE2E',  
    'jdm.loadingIndicator'
  ]);


angular
  .module('jdmLoadingIndicatorApp')
  .controller('MainCtrl', MainController)
  .config(MainConfig)
  .run(RunConfig);
  
MainController.$inject = ['$http', '$rootScope']

function MainController($http, $rootScope) {
    var vm = this;
    
    vm.showIndicator = false;
    vm.toggleIndicatorClick = toggleIndicatorClick;
    
    function toggleIndicatorClick() {
        vm.showIndicator = !vm.showIndicator;    
    };
    /*
    $http.get('https://www.reddit.com/r/webdev/.json').then(function(data) {
        console.log(data.data);
    });*/
    
    for(var x=0; x < 10; x++) {
        $http.get('/mockbackend').then(function(data) {
            console.log(data.data);
        });
    }
    
    $rootScope.$on('loadingIndicator:started', function(data) {
       console.log('Loading Indicator Started'); 
    });
    
	$rootScope.$on('loadingIndicator:stopped', function(data) {
       console.log('Loading Indicator Stopped'); 
    });
}

MainConfig.$inject = ['$httpProvider', '$provide', 'loadingIndicatorProvider']

function MainConfig($httpProvider, $provide, loadingIndicatorProvider) {
    $httpProvider.interceptors.push('loadingIndicatorInterceptor');
    
  $provide.decorator('$httpBackend', function ($delegate) {
    var proxy = function(method, url, data, callback, headers) {
      var interceptor = function() {
        var _this = this;
        var _arguments = arguments;
        var requestTime = (Math.random() * (4000 - 100) + 100);
        
        setTimeout(function() {
          callback.apply(_this, _arguments);
        }, requestTime);
        
        console.log('Request: ' + requestTime + 'ms');
      };
      return $delegate.call(this, method, url, data, interceptor, headers);
    };
    for(var key in $delegate) {
      proxy[key] = $delegate[key];
    }
    return proxy;
  });
}

/*
*/
RunConfig.$inject = ['$httpBackend'];

function RunConfig($httpBackend) {
  //mocking backend to simulate handling server messages
  $httpBackend.when('GET', '/mockbackend').respond({
    someData: "fhsdfshfshdfs"
  });
}
