
console.log("Hello, B-tech");


let name="Nisha";
console.log(name.toUpperCase());


let myarr=[1,2,3,4,5];
myarr.push(6);
console.log(myarr);

function myfunction(){
    console.log("This is my function");
}
myfunction();
 
function sum(a,b){
    console.log("the sum is:",a+b);
}
sum(3,4);

function addition(a,b){
   s=a+b;
   console.log("Before Return");
   return s;
}
let v=addition(2,6);
console.log(v);

const sub=(a,b)=> {
                                            
    return a+b;
}

let x=sum(3,5);
console.log(v);


function mean(a,b,c,d,e){
    return (a+b+c+d+e)/5;
}
let m=mean(1,2,3,4,5);
console.log("Mean is:",m);


let str="Hello, Good Morning";
console.log(str.includes(" Hello"));
console.log(str.startsWith(" good"));
console.log(str.endsWith(" Morning"));

let marks = [97,98,84,72];
marks[0]=96;
marks[1]=99;
marks[2]=85;
marks[3]=73;
marks[4]=100;
marks.push(100);
marks.pop();
marks.shift();
marks.unshift(99);
marks.splice(1,2);
marks.sort();
marks.reverse();
marks.toString();
marks.join(" and ");
marks.concat([1,2,3]);
marks.slice(1,3);
delete marks[0];
console.log(marks);

let fruits = ["Apple","Banana","Mango","Orange","Grapes"];
fruits.push("Pineapple");
console.log(fruits);
// the values are stored in linear fashion

let Num="Nisha";
Num[0]="P";
console.log(Num);
// String is immutable but array is mutable

// create an array of numbers and take input from the user to add number to this array
/*let arr=[];
let num1=prompt("Enter the size of array:");
for(let i=0;i<n;i++){
    arr[i]=prompt("Enter the number:");
}
console.log(arr);*/

// filer for numbers divisible by 10 from an array 
let numarr = [10, 20, 30 ];
console.log (" Array: ");
console.log(numarr);
let newNum = parseInt(prompt("Enter a number to add:")); 
numarr.push(newNum);
document.write("Updated Array: " + numarr);
console.log ("Updated Array: ");
console.log(numarr);

console.log("arr that check divisibility test ")
let arr3 = [10, 20, 45, 40];
let result = [];

for (let num of arr3){
    if( num % 10 == 0 ){
        result.push(num);
    }
}

console.log("Divisible by 10:", result); 
//we write a loop with the help of length
//for a given array with marks of students [94,85,76,88,99] find the average marks of the class
let marks1 = [94,85,76,88,99];
let sum1=0;
for(let i=0;i<marks1.length;i++){
    sum1+=marks1[i];
}
let avg=sum1/marks1.length;
console.log("Average marks of the class is:",avg);

//for a given array with prices of 5 items [645,250,300,900,50] all items 
// have an offer of 10% off on them change 
// the array to store final price after applying offer.

let prices = [645,250,300,900,50];
for(let i=0;i<prices.length;i++){
    prices[i]=prices[i]- (prices[i]*10)/100;
}
console.log("Final prices after 10% off:",prices);
