addMdToPage(`
  ### original dataset
`);

//Load the Dataset
let rawData = await dbQuery('SELECT * FROM result')

let someStudents = rawData.slice(0, 10);
console.log(someStudents)
tableFromData({ data: someStudents });


// //Check for misssing values
// addMdToPage(`
//   ### Check for misssing values
// `);
// let nullValues = rawData.map((row) => {
//   return Object.entries(row).reduce((acc, [key, value]) => {
//     if (value === null || value === undefined || value === '') {
//       acc.push(key);
//     }
//     return acc;
//   }, []);
// });
// let nullValuesCount = nullValues.reduce((acc, curr) => {
//   curr.forEach((key) => {
//     acc[key] = (acc[key] || 0) + 1;
//   });
//   return acc;
// }, {});
// console.log('nullValuesCount',nullValuesCount);
// //tableFromData({ data: Object.entries(nullValuesCount).map(([key, value]) => ({ key, value })) });

// //Check for duplicates
// addMdToPage(`
//   ### duplicates
// `);
// let duplicates = rawData.filter((item, index) => {
//   return rawData.findIndex((i) => i.ID === item.ID) !== index;
// });
// console.log(duplicates);
// //tableFromData({ data: duplicates });


//check if there are invalid genders
const genderValues = new Set();

rawData.forEach(student => {
  const gender = student.Gender;
  if (gender !== undefined && gender !== null) {
    genderValues.add(gender.trim().toLowerCase());
  }
});

console.log("Unique gender values:", [...genderValues]);

//check cities
const cityList = new Set();

rawData.forEach(student => {
  const city = student.City;
  if (city !== undefined && city !== null) {
    cityList.add(city.trim().toLowerCase());
  }
});

console.log("Cities:", [...cityList]);




//profession distribution
addMdToPage(`
  ### profession distribution (non student entries will be removed)
`);
const professionCount = {};

rawData.forEach(student => {
  const profession = student.Profession?.trim();
  if (profession) {
    professionCount[profession] = (professionCount[profession] || 0) + 1;
  }
});

// decending order
const sortedProfessionCount = Object.entries(professionCount)
  .sort((a, b) => b[1] - a[1])  // 按数量降序
  .map(([profession, count]) => ({ profession, count }));

//console.log('profession distribution', sortedProfessionCount);
tableFromData({ data: sortedProfessionCount});

//let professionCntSQL = await dbQuery('SELECT Profession, count(1) as quantity FROM result Group By Profession order by quantity desc');
//console.log(professionCntSQL);
//tableFromData({ data: professionCntSQL });



//check if academic pressure is a number
const academicPressureValues = new Set();
rawData.forEach(student => {
  const academicPressure = student.AcademicPressure;
  if (academicPressure !== undefined && academicPressure !== null) {
    academicPressureValues.add(academicPressure);
  }
});
console.log("Academic Pressure values:", [...academicPressureValues]);




//sleep duration distribution  
addMdToPage(`
  ### sleepDuration distribution 
`);

const sleepCount = {};

rawData.forEach(student => {
  const sleep = student.SleepDuration?.trim();
  if (sleep) {
    sleepCount[sleep] = (sleepCount[sleep] || 0) + 1;
  }
});
let sortedSleepCount = Object.entries(sleepCount)
  .sort((a, b) => b[1] - a[1])  // descending order
  .map(([sleep, count]) => ({ sleep, count }));

tableFromData({ data: sortedSleepCount});



//check how many types of sleepDuration
const sleepDuration = new Set();
rawData.forEach(student => {
  const sleep = student.SleepDuration;
  if (sleep !== undefined && sleep !== null) {
    sleepDuration.add(sleep);
  }
});
//console.log("Sleep hours:", [...sleepDuration]);
//'Less than 5 hours', '5-6 hours', '7-8 hours', 'More than 8 hours', Others

// mapping to number
const sleepMap = {
  "'5-6 hours'": 5.5,
  "'Less than 5 hours'": 4.5,
  "'7-8 hours'": 7.5,
  "'More than 8 hours'": 8.5,
  'others': null
};
