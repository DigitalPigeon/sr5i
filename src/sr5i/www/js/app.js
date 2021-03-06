// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.db', 'starter.domain', 'starter.controllers', 'starter.services', 'starter.directives'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    

    //nl.xservices.plugins.Insomnia required
    //https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin
    //https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git
    if(window.plugins && window.plugins.insomnia)
    {
        window.plugins.insomnia.keepAwake();
    }
  });
})


.config(function($stateProvider, $urlRouterProvider) {


  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
    $stateProvider

        //slide out menu
        .state('app', {
            url: '/app',
            abstract: true,
            templateUrl: 'templates/menu.html',
            controller: 'AppController'
        })

        .state('app.tracker', {
            url: '/tracker',
            views: {
                'main': {
                    templateUrl: 'templates/tracker.html',
                    controller: 'TrackerController'
                }
            }
        })

        .state('app.characterOptions', {
            url: '/characterOptions/:characterId',
            views: {
                'main': {
                    templateUrl: 'templates/characterOptions.html',
                    controller: 'CharacterOptionsController'
                }
            }
        })

        .state('app.addCharacter', {
            url: '/addCharacter',
            views: {
                'main': {
                    templateUrl: 'templates/addCharacter.html',
                    controller: 'AddCharacterController'
                }
            }
        })

        .state('app.editCharacter', {
            url: '/editCharacter/:characterId',
            views: {
                'main': {
                    templateUrl: 'templates/editCharacter.html',
                    controller: 'EditCharacterController'
                }
            }
        })

        .state('app.addCustomInterrupt', {
            url: '/addCustomInterrupt/:characterId',
            views: {
                'main': {
                    templateUrl: 'templates/addCustomInterrupt.html',
                    controller: 'AddCustomInterruptController'
                }
            }
        })

        
        
        ;

  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/tracker');

});
