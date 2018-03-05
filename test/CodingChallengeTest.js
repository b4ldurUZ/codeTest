const assert = require('chai').assert;
const CodingChallenge = require('rewire')('../CodingChallenge');

describe('CodingChallenge', function(){
    describe('Test addMessageToList', function(){
        let addMessageToList = CodingChallenge.__get__('addMessageToList');
        let result = addMessageToList('hello');
        it('addMessageToList should return number', function(){
            assert.isNumber(result, 'return value of addMessageToList is number');
        });
        it('return value of addMessageToList should alway be >= 0', function(){
            assert.isAtLeast(result, 0, 'return value of addMessageToList is greater or equal to 0');
        });
    });

    describe('Test retrieveMessageList', function(){
        let retrieveMessageList = CodingChallenge.__get__('retrieveMessageList');
        let result = retrieveMessageList([0,1]);
        it('addMessageToList should return array', function(){
            assert.isArray(result, 'return value of retrieveMessageList is Array');
        });
    });
});