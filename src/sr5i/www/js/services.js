angular.module('starter.services', [])

.factory('initiativeManagerService', ['domain$Character', function (domain$Character) {
  return {
    
  actingCharacter: function(characters) {
      
      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);
      if (characters.length > 0 && characters[0].initiative > 0) {
          //return this.charactersInActionOrder(characters)[0];
          return characters[0]
      }
      return null;
  },

  nextActingCharacter: function (actingCharacter, characters) {
      
      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);
      if (characters.length > 0 && characters[0].initiative > 0) {
          
          var foundActingCharacter = false;
          for (var count = 0; count < characters.length; count++)
          {
              //found the acting character last time, so this must be the next acting character
              if (foundActingCharacter)
              {
                  return characters[count];
              }

              if (characters[count].id == actingCharacter.id)
              {                  
                  foundActingCharacter = true;
              }
          }

      }
      return null;
  },

  currentInitiative: function (characters) {

      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);

      if (characters.length > 0) {
          return characters[0].initiative;
      } else {
          return 0;
      }
  },

  currentPass: function (characters) {

      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);

      if (characters.length > 0) {
          return characters[0].pass;
      } else {
          return 1;
      }
  },
  
  charactersInActionOrder: function(characters) {

      characters = characters || domain$Character.retrieveAll();

      characters.sort(function(a, b) {

          //first order by turn, future turns MUST be last
          if (a.turn > b.turn) { return 1; }
          if (a.turn < b.turn) { return -1; }
          
          //then order by 0 initiatives. 0 must always be first
          if (a.initiative == 0) { return 1; }
          if (b.initiative == 0) { return -1; }
          
          //now order by pass. those behind on passes should be first
          if (a.pass > b.pass) { return 1; }
          if (a.pass < b.pass) { return -1; }

          //finally order by initiative, order from highest to lowest
          if (a.initiative > b.initiative) { return -1; }
          if (a.initiative < b.initiative) { return 1; }

          //for consistancy, alphabetical sort ties
          if (a.name > b.name) { return 1; }
          if (a.name < b.name) { return -1; }

          return 0;

      });

      return characters;
  },

  takeTurn: function (character, newInitiativeScore, isNewCombat) {

      //if its on a turn delay, then count down the delay
      if (character.turn > 0) {
          character.turn--;
          console.log(character.name + '.turn: ' + character.turn);
      } else {
          
          //if an initiative was supplied, use it
          if (newInitiativeScore != undefined) {
              character.initiative = parseInt(newInitiativeScore);
          }

          character.pass = 1;
      }
      
      return character;
  },

  takePass: function (character) {

      //events don't take passes
      if (character.isEvent) {
          return character;
      }

      var nextActingCharacter = this.nextActingCharacter(character);
      
      var passCost = 10;
      
      //lower bound of 0 initiative
      if (character.initiative - passCost < 0) {
          character.initiative = 0;
      } else {
          character.initiative = parseInt(character.initiative) - 10;
          character.pass++;
      }

      if (nextActingCharacter)
      {
          nextActingCharacter.effects = [];
      }      
      
      return [character, nextActingCharacter];
  },

  applyInterrupt: function (character, interrupt) {

      if (interrupt.initiative || interrupt.initiative == 0) {
          character.initiative = parseInt(interrupt.initiative) + parseInt(character.initiative);
      }

      //lower bound of 0 initiative
      if (character.initiative < 0) {
          character.initiative = 0;
      }

      //persist if required
      if (interrupt.persist) {

          //only persist if they don't already have this
          for (var count = 0; count < character.effects.length; count++) {
            if (character.effects[count] == interrupt.name) {
                return character;
            }
          }
          character.effects.push(interrupt.name);
      }
      
      return character;
  }
};

} ])


.factory('characterOptionsService', [function() {
    
    return{
    };

}])


;
