/*
In this exercise we will gradually use more and more aspects of JS functions on a simple example.
let diceRoll=[1,6,6,2,3,4,6];

Write a function get6s_v1 that takes an array of numbers (dice values 1..6) as parameter, and prints 
the indexes and corresponding values of the array where elements are 6s. E.g., 1:6, 2:6, 6:6 ..." 
excluding other elements. At this stage, just write a basic version, eg. without using functions as parameters. 
Apply the function to the above array as argument.
*/

let diceRoll=[1,6,6,2,3,4,6];

function get6s_v1(numbers){
    for (i in numbers)
        if(numbers[i] === 6)
            console.log(i+":"+numbers[i]);
}

//get6s_v1(diceRoll);

/*
Write a helper function eg "is6(v)" that can test if the supplied parameter value v is a 6 
Rewrite get6s_v1 to get6_v2 such that it uses the helper function to test if the index/value should be printed. 
Apply the function to the above array. 
*/

function is6(v){
    if(v === 6)
        return true;

    return false;
}

function get6s_v2(numbers){
    for (i in numbers)
        if(is6(numbers[i]))
            console.log(i+":"+numbers[i]);
}

//get6s_v2(diceRoll);

/*
Now create a get6s_v3 that rewrites get6_v2 to accept a dice array as first parameter, and a "compare" function as second parameter.
Apply the function using the diceRoll and function "is6" as actual arguments
*/

function get6s_v3(numbers, compare){
    for (i in numbers)
        if(compare(numbers[i]))
            console.log(i+":"+numbers[i]);
}

//get6s_v3(diceRoll, is6);

/*
Copy and rename the get6s_v3 function to findDices_v1(dice,compare). Call it with the same arguments as above using the diceRoll and function "is6"
Then call it using a function expression (named or anonymous) at the call site, to pass a function that selects 1 dices. 
*/

var result1 = function findDices_v1(numbers,compare){
    for (i in numbers)
        if(compare(numbers[i]))
            console.log(i+":"+numbers[i]);
}

//result1(diceRoll, is6);

/*
Then call it using a lambda expression to pass a function that selects dices with values <= 3. 

var add = (a, b) => {
  return a + b;
};
*/

function is_number_less_or_equal(x, y){
    if(x <= y)
        return true;

    return false;
}

var result2 = (numbers, compare) => {
    for (i in numbers)
        if(compare(numbers[i], 3))
            console.log(i+":"+numbers[i]);
}


//result2(diceRoll, is_number_less_or_equal);

/*
(advanced:)  what does the following statement produce?
diceRoll.filter(dice=>dice==6).reduce((sum,dice)=>sum+dice,0);

filters diceRoll by only taking values that are equal to 6 then uses the reduce function to add sum and all the values in the new dice array together.
*/

