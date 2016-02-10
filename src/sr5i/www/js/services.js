angular.module('starter.services', [])

.factory('initiativeManagerService', [function() {
  return {
    
    setNew: function(character, newInitiativeScore) {
        character.initiative = parseInt(newInitiativeScore);
        character.pass = 1;
      return character;
  },

  actingCharacter: function(characters) {
      if (this.charactersInActionOrder(characters)[0].initiative > 0) {
          return this.charactersInActionOrder(characters)[0];
      }
      return null;
  },

  charactersInActionOrder: function(characters) {

      characters.sort(function(a, b) {
          
          var passOrder = (a.pass - b.pass) * 1000; //lowest pass first
          var actionOrder = b.initiative - a.initiative; //highest initiative first

          var result = passOrder + actionOrder;

          //if there is no initiative left, always return last
          if (b.initiative == 0) {
              result = -99999999999999;
          }

          if (a.initiative == 0) {
              result = 99999999999999;
          }
          
          return result;
      });

      return characters;
  },

  takePass: function (character) {

      var passCost = 10;
      
      //lower bound of 0 initiative
      if (character.initiative - passCost < 0) {
          character.initiative = 0;
      } else {
          character.initiative = parseInt(character.initiative) - 10;
          character.pass++;
      }
      
      return character;
  },

  applyInterupt: function (character, interupt) {

      if (interupt.initiative || interupt.initiative == 0) {
          character.initiative = parseInt(interupt.initiative) + parseInt(character.initiative);
      }

      //lower bound of 0 initiative
      if (character.initiative < 0) {
          character.initiative = 0;
      }
      
      return character;
  }
};

} ])





;
