angular.module('starter.controllers', [])


    .controller('AppController', function ($rootScope, $scope, $state, $q, $ionicPopup, db, domain$Character, initiativeManagerService) {

        $scope.goBack = function() {
            $rootScope.$ionicGoBack();        
        };

        $scope.activeCharacterTakesPass = function () {
            var actingCharacter = $scope.actingCharacter();
            initiativeManagerService.takePass(actingCharacter);
            domain$Character.persist(actingCharacter);
            $scope.reloadHome();
        };

        $scope.actingCharacter = function() {
            return initiativeManagerService.actingCharacter(domain$Character.retrieveAll());
        }

        $scope.reloadHome = function() {
            $state.go('app.tracker', null, { reload: true });    
        };

        $scope.clearEverything = function() {
            $ionicPopup.confirm({ title: 'Clear everything?', subTitle: 'This cannot be undone.' })
                .then(function (result) {
                    if (result) {
                        db.reset();
                        $scope.reloadHome();    
                    }
                });
        };

        $scope.addCharacter = function () {
            $state.go('app.addCharacter');
        };

        $scope.showCharacterOptions = function (character) {
            $state.go('app.characterOptions', {characterId: character.id});
        };

        $scope.rollInitiative = function () {
            var characters = domain$Character.retrieveAll();

            var rollAll = function() {

                var deferred = $q.defer();
                var rolledCount = 0;

                angular.forEach(characters, function(character) {

                    $ionicPopup.prompt({ title: character.name + "'s" + ' initiative?' })
                        .then(function (result) {
                            deferred.notify(character.name);
                            if (result) {
                                initiativeManagerService.setNew(character, result);
                                domain$Character.persist(character);
                            }

                            rolledCount++;
                        if (rolledCount == characters.length) {
                            deferred.resolve(rolledCount);
                        }
                    });

                });
                
                return deferred.promise;
            };
            
            rollAll()
            .then(function(result) {
                $scope.reloadHome();  
            });
            
        };
            
    })

    .controller('TrackerController', function ($scope, domain$Character, initiativeManagerService) {

        $scope.$on('$ionicView.enter', function() {
            $scope.characters = initiativeManagerService.charactersInActionOrder(domain$Character.retrieveAll());

            angular.forEach($scope.characters, function (character) {

                //console.log('tracker for ' + character.name + ": " + character.initiative);

            });

        }); 

    })

    .controller('CharacterOptionsController', function ($rootScope, $scope, $stateParams, $ionicPopup, domain$Character, initiativeManagerService) {

        $scope.character = domain$Character.retrieve($stateParams.characterId);
        
        $scope.deleteCharacter = function (character) {

            $ionicPopup.confirm({ title: 'Delete ' + character.name + '?', subTitle: 'This cannot be undone.' })
                    .then(function (result) {
                        if (result) {
                            domain$Character.del(character.id);
                            $rootScope.$ionicGoBack();
                        }
                    });

        };

        $scope.addInterupt = function (character, interupt) {

            initiativeManagerService.applyInterupt(character, interupt);
            domain$Character.persist(character);
            $rootScope.$ionicGoBack();
        };
           

    })


    .controller('AddCharacterController', function ($scope, domain$Character) {

        $scope.$on('$ionicView.enter', function () {
            $scope.character = { name: '', initiative: '', eventThisPass: false, eventNextPass: false };
            console.log($scope.character);
        });

        $scope.create = function() {
            console.log($scope.character);
            domain$Character.persist({ name: $scope.character.name, initiative: $scope.character.initiative, pass: 1 });
            $scope.reloadHome();
        }

    })
        

;



