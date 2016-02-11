angular.module('starter.controllers', [])


    .controller('AppController', function ($rootScope, $scope, $state, $q, $ionicPopup, $ionicHistory, db, domain$Character, initiativeManagerService) {

        $scope.goBack = function() {
            $rootScope.$ionicGoBack();        
        };

        $scope.activeCharacterTakesPass = function () {
            var actingCharacter = $scope.actingCharacter();

            if (actingCharacter.isEvent) {
                $ionicPopup.alert({ title: actingCharacter.name + ' Occurs!', subTitle: 'This event is now complete.' })
                    .then(function() {
                        domain$Character.del(actingCharacter.id);
                        $scope.reloadHome();
                    });
            } else {
                    initiativeManagerService.takePass(actingCharacter);
                    domain$Character.persist(actingCharacter);
                    $scope.reloadHome();    
            }
        };

        $scope.actingCharacter = function() {
            return initiativeManagerService.actingCharacter(domain$Character.retrieveAll());
        }

        $scope.reloadHome = function() {

            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            
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

        $scope.rollInitiative = function (isNewCombat) {
            var characters = domain$Character.retrieveAll();

            var rollAll = function() {

                var deferred = $q.defer();
                var rolledCount = 0;

                angular.forEach(characters, function(character) {

                    if (!character.isEvent) {
                        $ionicPopup.prompt({ title: character.name + "'s" + ' initiative?' })
                            .then(function(result) {
                                deferred.notify(character.name);
                                if (result) {
                                    initiativeManagerService.takeTurn(character, result, isNewCombat);
                                    domain$Character.persist(character);
                                }

                                rolledCount++;
                                if (rolledCount == characters.length) {
                                    deferred.resolve(rolledCount);
                                }
                            });
                    } else {
                            //we still need to count the event as rolled
                            rolledCount++;
                            if (rolledCount == characters.length) {
                                deferred.resolve(rolledCount);
                            }
                    }
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

                console.log(character);

            });

        }); 

    })

    .controller('CharacterOptionsController', function ($rootScope, $scope, $state, $stateParams, $ionicPopup, domain$Character, initiativeManagerService) {


        $scope.$on('$ionicView.beforeEnter', function() {
            $scope.character = domain$Character.retrieve($stateParams.characterId);
        });
        
        $scope.deleteCharacter = function (character) {

            $ionicPopup.confirm({ title: 'Delete ' + character.name + '?', subTitle: 'This cannot be undone.' })
                    .then(function (result) {
                        if (result) {
                            domain$Character.del(character.id);
                            $rootScope.$ionicGoBack();
                        }
                    });

        };

        $scope.editCharacter = function(character) {
            $state.go('app.editCharacter', {characterId: character.id});
        };


        $scope.addInterupt = function (character, interupt) {

            initiativeManagerService.applyInterupt(character, interupt);
            domain$Character.persist(character);
            $rootScope.$ionicGoBack();
        };
           

    })


    .controller('AddCharacterController', function ($scope, domain$Character, initiativeManagerService  ) {

        $scope.$on('$ionicView.enter', function () {
            $scope.character = { name: '', initiative: '', eventThisPass: false, eventNextPass: false };

            $scope.currentInitiative = initiativeManagerService.currentInitiative();
            $scope.currentPass = initiativeManagerService.currentPass();
            $scope.currentTurn = initiativeManagerService.currentTurn();

        });

        $scope.create = function (eventOffset) {

            //if scheduled for next turn, then it will occur on the first pass of that turn
            var currentPass = $scope.currentPass;
            var currentTurn = $scope.currentTurn;

            var triggeringTurn = !eventOffset ? currentTurn : (currentTurn + eventOffset.turn);
            var triggeringPass = !eventOffset ? currentPass : (currentPass + eventOffset.pass);

            //special case, if the triggering turn is in the future, then that pass must be 1st (since its a new turn)
            if (eventOffset && eventOffset.turn > 0) {
                triggeringPass = 1;
            }

            domain$Character.persist({ name: $scope.character.name, 
                                        initiative: $scope.character.initiative, pass: triggeringPass, turn: triggeringTurn,
                                        isEvent: eventOffset != undefined,
                                        effects: []
                                    });
            $scope.reloadHome();

        }

    })


    .controller('EditCharacterController', function ($scope, $stateParams, domain$Character, initiativeManagerService) {

        $scope.$on('$ionicView.enter', function () {

            var characterId = $stateParams.characterId;
            $scope.character = domain$Character.retrieve(characterId);
        });

        $scope.update = function (character) {
            domain$Character.persist(character);
            $scope.reloadHome();
        }

    })
        

;



